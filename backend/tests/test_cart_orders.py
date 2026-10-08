"""Tests for cart, wishlist, and order ownership."""


def test_cart_requires_auth(client):
    resp = client.get("/api/v1/cart")
    assert resp.status_code == 401


def test_cart_empty(client, customer_token):
    resp = client.get(
        "/api/v1/cart",
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert resp.status_code == 200
    assert resp.get_json()["data"]["items"] == []


def test_wishlist_requires_auth(client):
    resp = client.get("/api/v1/wishlist")
    assert resp.status_code == 401


def test_wishlist_empty(client, customer_token):
    resp = client.get(
        "/api/v1/wishlist",
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert resp.status_code == 200
    assert resp.get_json()["data"] == []


def test_order_list_requires_auth(client):
    resp = client.get("/api/v1/orders")
    assert resp.status_code == 401


def test_order_empty(client, customer_token):
    resp = client.get(
        "/api/v1/orders",
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert resp.status_code == 200
    assert resp.get_json()["data"] == []


def test_admin_cannot_access_customer_cart(client, admin_token):
    """Admin JWT should be rejected by customer endpoints."""
    resp = client.get(
        "/api/v1/cart",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 403
