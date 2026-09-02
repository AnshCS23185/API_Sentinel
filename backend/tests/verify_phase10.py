import sys
import httpx
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.db.session import SessionLocal
from app.models.admin_user import AdminUser
from app.models.rate_limit_plan import RateLimitPlan
from app.models.api_consumer import ApiConsumer
from app.models.api_key import ApiKey
from app.models.api_endpoint import ApiEndpoint
from app.utils.security import generate_api_key, get_password_hash, create_jwt_token
import uuid

BASE_URL = "http://localhost:8000"


def run_e2e_verification():
    print("==================================================")
    print("PHASE 10: E2E RATE LIMITING & VIOLATIONS VERIFICATION")
    print("==================================================")

    db = SessionLocal()
    client = httpx.Client(base_url=BASE_URL, timeout=10.0)

    try:
        # 1. Provision Admin User & Login
        print("\n--- Step 1: Admin User Provisioning & Authentication ---")
        admin_email = f"e2e_admin_{uuid.uuid4().hex[:6]}@sentinel.local"
        admin_pass = "AdminE2EPass123!"
        admin_user = AdminUser(
            email=admin_email,
            password_hash=get_password_hash(admin_pass),
            is_active=True,
        )
        db.add(admin_user)
        db.commit()

        login_res = client.post("/api/auth/login", json={"email": admin_email, "password": admin_pass})
        if login_res.status_code != 200:
            print(f"FAILED Admin login: {login_res.status_code} - {login_res.text}")
            sys.exit(1)
        admin_token = login_res.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        print(f"✓ Admin Login Successful for email: {admin_email}")

        # 2. Setup DB Test Setup (Plan: 3 requests / 10s, Consumer, API Key, Endpoint)
        print("\n--- Step 2: Provisioning Test Plan & Consumer ---")
        plan = RateLimitPlan(
            name=f"E2E Strict Plan {uuid.uuid4().hex[:6]}",
            requests_per_window=3,
            window_seconds=10,
            is_active=True,
        )
        db.add(plan)
        db.commit()

        consumer = ApiConsumer(name=f"E2E Consumer {uuid.uuid4().hex[:6]}", plan_id=plan.id, status="active")
        db.add(consumer)
        db.commit()

        raw_key, key_prefix, key_hash = generate_api_key()
        api_key = ApiKey(consumer_id=consumer.id, name="E2E Key", key_prefix=key_prefix, key_hash=key_hash, is_active=True)
        db.add(api_key)
        db.commit()

        ep_path = f"/api/items_{uuid.uuid4().hex[:6]}"
        endpoint = ApiEndpoint(
            name="E2E Endpoint",
            method="GET",
            path=ep_path,
            target_url=f"http://demo-api:8002/health",
            is_active=True,
        )
        db.add(endpoint)
        db.commit()

        print(f"✓ Provisioned Consumer ID: {consumer.id}, Plan Limit: 3 req / 10s, Endpoint Path: {ep_path}")

        # 3. Test Gateway Rate Limiting Flow
        print("\n--- Step 3: Executing Gateway Proxy Requests ---")
        consumer_headers = {"Authorization": f"Bearer {raw_key}"}

        # Request 1
        r1 = client.get(f"/api/gateway{ep_path}", headers=consumer_headers)
        print(f"Req 1 Status: {r1.status_code}, X-RateLimit-Limit: {r1.headers.get('x-ratelimit-limit')}, X-RateLimit-Remaining: {r1.headers.get('x-ratelimit-remaining')}")
        assert r1.status_code == 200
        assert r1.headers.get("x-ratelimit-remaining") == "2"

        # Request 2
        r2 = client.get(f"/api/gateway{ep_path}", headers=consumer_headers)
        print(f"Req 2 Status: {r2.status_code}, X-RateLimit-Remaining: {r2.headers.get('x-ratelimit-remaining')}")
        assert r2.status_code == 200
        assert r2.headers.get("x-ratelimit-remaining") == "1"

        # Request 3
        r3 = client.get(f"/api/gateway{ep_path}", headers=consumer_headers)
        print(f"Req 3 Status: {r3.status_code}, X-RateLimit-Remaining: {r3.headers.get('x-ratelimit-remaining')}")
        assert r3.status_code == 200
        assert r3.headers.get("x-ratelimit-remaining") == "0"

        # Request 4 -> EXCEEDED -> HTTP 429
        r4 = client.get(f"/api/gateway{ep_path}", headers=consumer_headers)
        print(f"Req 4 Status: {r4.status_code}, Detail: {r4.json().get('detail')}, Retry-After: {r4.headers.get('retry-after')}")
        assert r4.status_code == 429
        assert r4.json().get("detail") == "Rate limit exceeded"
        assert int(r4.headers.get("retry-after", 0)) >= 1
        print("✓ Rate Limiting 429 Response Verified!")

        # 4. Admin Violation Query Verification
        print("\n--- Step 4: Admin Violation Query Verification ---")
        v_list_res = client.get(f"/api/violations?consumer_id={consumer.id}", headers=admin_headers)
        print(f"GET /api/violations Status: {v_list_res.status_code}, Total Violations: {v_list_res.json().get('total')}")
        assert v_list_res.status_code == 200
        v_data = v_list_res.json()
        assert v_data["total"] >= 1
        first_violation = v_data["violations"][0]
        assert first_violation["consumer_id"] == consumer.id
        assert first_violation["limit"] == 3
        print(f"✓ Violation List Verified: Consumer '{first_violation['consumer_name']}', Prefix '{first_violation['key_prefix']}', Limit {first_violation['limit']}")

        v_detail_res = client.get(f"/api/violations/{first_violation['id']}", headers=admin_headers)
        assert v_detail_res.status_code == 200
        print(f"✓ Violation Detail Verified for ID {first_violation['id']}")

        # 5. Security & Isolation Check
        print("\n--- Step 5: Security & Isolation Check ---")
        unauth_v_res = client.get("/api/violations", headers=consumer_headers)
        assert unauth_v_res.status_code == 401
        print("✓ Consumer API Key accessing Admin /api/violations rejected with 401 Unauthorized")

        print("\n==================================================")
        print("✓ ALL PHASE 10 LIVE E2E VERIFICATIONS PASSED 100%!")
        print("==================================================")

    finally:
        db.close()


if __name__ == "__main__":
    run_e2e_verification()
