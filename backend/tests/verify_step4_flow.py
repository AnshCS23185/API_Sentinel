import time
import httpx
from app.core.config import settings

def run_step4_verification():
    base_url = "http://localhost:8000"
    client = httpx.Client(base_url=base_url, timeout=15.0)

    print("=== 1. Testing Admin Authentication & Login ===")
    login_res = client.post(
        "/api/auth/login",
        json={
            "email": settings.INITIAL_ADMIN_EMAIL,
            "password": settings.INITIAL_ADMIN_PASSWORD,
        },
    )
    assert login_res.status_code == 200, f"Admin login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {token}"}
    print("Admin login successful.")

    # Verify protected routes
    for r in ["/api/auth/me", "/api/consumers", "/api/plans", "/api/analytics/summary", "/api/violations"]:
        res = client.get(r, headers=admin_headers)
        assert res.status_code == 200, f"Protected route {r} failed: {res.status_code}"
    print("Protected admin routes verified successfully.")

    print("\n=== 2. Creating Test Plan and Consumer for Verification ===")
    # Create a plan with 3 requests per 3 seconds for fast rate-limit & recovery testing
    plan_data = {
        "name": f"Step4_Test_Plan_{int(time.time())}",
        "description": "Short-window plan for local rate limit verification",
        "requests_per_window": 3,
        "window_seconds": 3,
        "is_active": True,
    }
    plan_res = client.post("/api/plans", json=plan_data, headers=admin_headers)
    assert plan_res.status_code == 201, f"Create plan failed: {plan_res.text}"
    plan_id = plan_res.json()["id"]
    print(f"Created plan ID: {plan_id}")

    consumer_data = {
        "name": "Step4 Verification Consumer",
        "email": "step4_consumer@sentinel.local",
        "description": "Automated verification test consumer",
        "plan_id": plan_id,
    }
    consumer_res = client.post("/api/consumers", json=consumer_data, headers=admin_headers)
    assert consumer_res.status_code == 201, f"Create consumer failed: {consumer_res.text}"
    consumer_id = consumer_res.json()["id"]
    print(f"Created consumer ID: {consumer_id}")

    # Generate API key
    key_res = client.post(
        f"/api/consumers/{consumer_id}/keys",
        json={"name": "Step4 Test Key"},
        headers=admin_headers,
    )
    assert key_res.status_code == 201, f"Create key failed: {key_res.text}"
    key_data = key_res.json()
    key_id = key_data["id"]
    raw_key = key_data["raw_key"]
    print(f"Generated API key ID: {key_id}, Prefix: {key_data['key_prefix']}")

    print("\n=== 3. Verifying Consumer API Key Authentication ===")
    # Missing key
    res = client.get("/api/gateway/products")
    assert res.status_code == 401, f"Missing key expected 401, got {res.status_code}"
    print("Missing key rejected with 401.")

    # Invalid key
    res = client.get("/api/gateway/products", headers={"Authorization": "Bearer sen_live_invalidtoken123456"})
    assert res.status_code == 401, f"Invalid key expected 401, got {res.status_code}"
    print("Invalid key rejected with 401.")

    # Valid key
    consumer_headers = {"Authorization": f"Bearer {raw_key}"}
    res = client.get("/api/gateway/products", headers=consumer_headers)
    assert res.status_code == 200, f"Valid key expected 200, got {res.status_code}: {res.text}"
    print("Valid key accepted with 200 OK.")

    # Inactive key
    patch_res = client.patch(f"/api/keys/{key_id}", json={"is_active": False}, headers=admin_headers)
    assert patch_res.status_code == 200
    res = client.get("/api/gateway/products", headers=consumer_headers)
    assert res.status_code == 401, f"Inactive key expected 401, got {res.status_code}"
    print("Inactive key rejected with 401.")

    # Reactivate key
    client.patch(f"/api/keys/{key_id}", json={"is_active": True}, headers=admin_headers)
    res = client.get("/api/gateway/products", headers=consumer_headers)
    assert res.status_code == 200
    print("Reactivated key accepted with 200 OK.")

    print("\n=== 4. Verifying Gateway -> Demo API End-to-End Flow ===")
    res = client.get("/api/gateway/products", headers=consumer_headers)
    assert res.status_code == 200, f"Gateway call failed: {res.status_code}"
    body = res.json()
    assert "data" in body, f"Expected data field from demo-api, got {body}"
    assert len(body["data"]) > 0, "Expected non-empty product list from demo-api"
    print(f"Gateway successfully proxied to Demo API. Received {len(body['data'])} products.")

    # Test invalid upstream path
    res_404 = client.get("/api/gateway/nonexistent/endpoint", headers=consumer_headers)
    assert res_404.status_code == 404, f"Expected 404 for nonexistent path, got {res_404.status_code}"
    print("Invalid path through gateway correctly returned 404.")

    print("\n=== 5. Verifying Redis Rate Limiting & Headers ===")
    # Plan limit is 3 req per 3 sec. Let's wait 3s first to ensure a clean window
    time.sleep(3.2)

    responses = []
    for i in range(5):
        r = client.get("/api/gateway/products", headers=consumer_headers)
        responses.append(r)
        print(f"Request {i+1}: Status {r.status_code}, Limit: {r.headers.get('x-ratelimit-limit')}, Remaining: {r.headers.get('x-ratelimit-remaining')}, Retry-After: {r.headers.get('retry-after')}")

    # First 3 should be 200
    for i in range(3):
        assert responses[i].status_code == 200, f"Request {i+1} should have succeeded"
        assert responses[i].headers.get("x-ratelimit-limit") == "3"
    
    # 4th and 5th should be 429
    assert responses[3].status_code == 429, f"Request 4 should have been rate limited (429), got {responses[3].status_code}"
    assert responses[3].headers.get("retry-after") is not None, "Retry-After header missing on 429"
    assert responses[4].status_code == 429, f"Request 5 should have been rate limited (429), got {responses[4].status_code}"
    print("Redis rate limiting verified: Requests exceeding limit returned 429 with correct headers.")

    # Verify violation logged in DB
    viol_res = client.get(f"/api/violations?consumer_id={consumer_id}", headers=admin_headers)
    assert viol_res.status_code == 200
    viols = viol_res.json()["violations"]
    assert len(viols) >= 2, f"Expected at least 2 violations recorded, found {len(viols)}"
    print(f"Rate limit violations correctly persisted in database: {len(viols)} violations recorded.")

    print("\n=== 6. Verifying Rate Limit Recovery ===")
    retry_after = int(responses[3].headers.get("retry-after", 3))
    print(f"Waiting {retry_after + 1}s for rate limit window to expire...")
    time.sleep(retry_after + 1.2)

    recovered_res = client.get("/api/gateway/products", headers=consumer_headers)
    assert recovered_res.status_code == 200, f"Recovered request should succeed (200), got {recovered_res.status_code}"
    print("Rate limit recovery verified: subsequent request after window expiry returned 200 OK.")

    print("\n=== ALL STEP 4 FLOW VERIFICATIONS PASSED SUCCESSFULLY ===")

if __name__ == "__main__":
    run_step4_verification()
