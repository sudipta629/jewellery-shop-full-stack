"""Tests for categories and products."""
import pytest


def test_list_categories_empty(client):
    resp = client.get("/api/v1/categories")
    assert resp.status_code == 200
    assert resp.get_json()["data"] == []


def test_create_category_requires_admin(client, customer_token):
    resp = client.post(
        "/api/v1/categories",
        json={"name": "Rings"},
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert resp.status_code == 403


def test_create_category_success(client, admin_token):
    resp = client.post(
        "/api/v1/categories",
        json={"name": "Necklaces", "description": "Gold and diamond necklaces"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 201
    data = resp.get_json()["data"]
    assert data["name"] == "Necklaces"
    assert data["slug"] == "necklaces"


def test_create_duplicate_category(client, admin_token):
    client.post(
        "/api/v1/categories",
        json={"name": "Earrings"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    resp = client.post(
        "/api/v1/categories",
        json={"name": "Earrings"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 409


def test_create_product_success(client, admin_token):
    # Create category first
    cat_resp = client.post(
        "/api/v1/categories",
        json={"name": "Rings Test"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    cat_id = cat_resp.get_json()["data"]["id"]

    resp = client.post(
        "/api/v1/products",
        json={
            "sku": "RING001",
            "name": "Gold Ring",
            "category_id": cat_id,
            "metal_type": "gold",
            "purity": "22K",
            "net_weight": "5.5",
            "gross_weight": "6.0",
            "making_charge_per_gram": "150",
            "tax_percent": "3",
            "stock": 10,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 201
    data = resp.get_json()["data"]
    assert data["sku"] == "RING001"
    assert data["stock"] == 10


def test_product_list_public(client):
    resp = client.get("/api/v1/products")
    assert resp.status_code == 200
    assert "data" in resp.get_json()
    assert "pagination" in resp.get_json()


def test_product_price_requires_rate(client, admin_token):
    """Product price endpoint returns 422 when no rate is set."""
    cat_resp = client.post(
        "/api/v1/categories",
        json={"name": "Bangles Test"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    cat_id = cat_resp.get_json()["data"]["id"]

    prod_resp = client.post(
        "/api/v1/products",
        json={
            "sku": "BANGLE001",
            "name": "Gold Bangle",
            "category_id": cat_id,
            "metal_type": "gold",
            "purity": "22K",
            "net_weight": "10",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    pid = prod_resp.get_json()["data"]["id"]
    resp = client.get(f"/api/v1/products/{pid}/price")
    # Should get 422 since no rates are seeded in test db
    assert resp.status_code == 422
    assert resp.get_json()["error"]["code"] == "PRICE_UNAVAILABLE"
