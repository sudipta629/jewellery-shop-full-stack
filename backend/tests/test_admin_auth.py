"""Tests for admin authentication."""


def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.get_json()["status"] == "ok"


def test_admin_login_success(client, super_admin):
    resp = client.post(
        "/api/v1/admin/auth/login",
        json={"email": "superadmin@test.com", "password": "TestPass123!"},
    )
    assert resp.status_code == 200
    data = resp.get_json()["data"]
    assert "access_token" in data
    assert data["admin"]["role"] == "super_admin"


def test_admin_login_wrong_password(client, super_admin):
    resp = client.post(
        "/api/v1/admin/auth/login",
        json={"email": "superadmin@test.com", "password": "WrongPassword"},
    )
    assert resp.status_code == 401
    assert resp.get_json()["error"]["code"] == "INVALID_CREDENTIALS"


def test_admin_login_missing_fields(client):
    resp = client.post("/api/v1/admin/auth/login", json={})
    assert resp.status_code == 400


def test_admin_me_requires_token(client):
    resp = client.get("/api/v1/admin/auth/me")
    assert resp.status_code == 401


def test_admin_me_with_token(client, admin_token):
    resp = client.get(
        "/api/v1/admin/auth/me",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    assert resp.get_json()["data"]["email"] == "superadmin@test.com"


def test_customer_token_cannot_access_admin(client, customer_token):
    """Confirm customer tokens are rejected by admin endpoints."""
    resp = client.get(
        "/api/v1/admin/auth/me",
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert resp.status_code == 403
