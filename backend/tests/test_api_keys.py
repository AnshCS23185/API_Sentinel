from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.main import app
from app.models.api_consumer import ApiConsumer
from app.models.api_key import ApiKey

client = TestClient(app)


def test_create_api_key_returns_raw_key_once(db_session: Session, auth_headers: dict):
    consumer = ApiConsumer(name="Key Target Consumer", status="active")
    db_session.add(consumer)
    db_session.commit()
    db_session.refresh(consumer)

    response = client.post(f"/api/consumers/{consumer.id}/keys", json={"name": "Production Key"}, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()

    # Raw key checks
    assert "raw_key" in data
    raw_key = data["raw_key"]
    assert raw_key.startswith("sen_live_")

    # Prefix checks
    assert "key_prefix" in data
    assert data["key_prefix"] == raw_key[:16]
    assert len(data["key_prefix"]) == 16

    # Security check: key_hash MUST NOT be in API response
    assert "key_hash" not in data

    # Verify DB state directly: raw_key MUST NOT be in DB
    db_session.expire_all()
    db_key = db_session.scalar(select(ApiKey).where(ApiKey.id == data["id"]))
    assert db_key is not None
    assert db_key.key_prefix == raw_key[:16]
    assert db_key.key_hash != raw_key
    assert not hasattr(db_key, "raw_key")


def test_list_api_keys_omits_raw_key_and_hash(db_session: Session, auth_headers: dict):
    consumer = ApiConsumer(name="Key List Consumer", status="active")
    db_session.add(consumer)
    db_session.commit()
    db_session.refresh(consumer)

    client.post(f"/api/consumers/{consumer.id}/keys", json={"name": "Key 1"}, headers=auth_headers)
    client.post(f"/api/consumers/{consumer.id}/keys", json={"name": "Key 2"}, headers=auth_headers)

    response = client.get(f"/api/consumers/{consumer.id}/keys", headers=auth_headers)
    assert response.status_code == 200
    items = response.json()
    assert len(items) == 2

    for key_data in items:
        assert "key_prefix" in key_data
        assert "raw_key" not in key_data
        assert "key_hash" not in key_data


def test_get_api_key_details_omits_raw_key_and_hash(db_session: Session, auth_headers: dict):
    consumer = ApiConsumer(name="Single Key Consumer", status="active")
    db_session.add(consumer)
    db_session.commit()
    db_session.refresh(consumer)

    create_res = client.post(f"/api/consumers/{consumer.id}/keys", json={"name": "Single Key"}, headers=auth_headers)
    key_id = create_res.json()["id"]

    response = client.get(f"/api/keys/{key_id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == key_id
    assert "key_prefix" in data
    assert "raw_key" not in data
    assert "key_hash" not in data


def test_update_and_deactivate_api_key(db_session: Session, auth_headers: dict):
    consumer = ApiConsumer(name="Key Update Consumer", status="active")
    db_session.add(consumer)
    db_session.commit()
    db_session.refresh(consumer)

    create_res = client.post(f"/api/consumers/{consumer.id}/keys", json={"name": "Active Key"}, headers=auth_headers)
    key_id = create_res.json()["id"]

    # Deactivate key
    response = client.patch(f"/api/keys/{key_id}", json={"is_active": False, "name": "Disabled Key"}, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["is_active"] is False
    assert data["name"] == "Disabled Key"


def test_delete_api_key(db_session: Session, auth_headers: dict):
    consumer = ApiConsumer(name="Key Delete Consumer", status="active")
    db_session.add(consumer)
    db_session.commit()
    db_session.refresh(consumer)

    create_res = client.post(f"/api/consumers/{consumer.id}/keys", json={"name": "Delete Me"}, headers=auth_headers)
    key_id = create_res.json()["id"]

    response = client.delete(f"/api/keys/{key_id}", headers=auth_headers)
    assert response.status_code == 200

    # Verify key deleted from DB
    db_session.expire_all()
    assert db_session.scalar(select(ApiKey).where(ApiKey.id == key_id)) is None


def test_api_key_nonexistent_consumer(db_session: Session, auth_headers: dict):
    response = client.post("/api/consumers/99999/keys", json={"name": "Ghost Key"}, headers=auth_headers)
    assert response.status_code == 404


def test_api_key_nonexistent_key_id(db_session: Session, auth_headers: dict):
    response = client.get("/api/keys/99999", headers=auth_headers)
    assert response.status_code == 404
