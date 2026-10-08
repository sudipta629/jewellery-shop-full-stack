"""
Cart endpoints (server-side, customer-owned).

GET    /api/v1/cart           — view cart with computed prices
POST   /api/v1/cart/items     — add item
PATCH  /api/v1/cart/items/<id> — update quantity
DELETE /api/v1/cart/items/<id> — remove item
DELETE /api/v1/cart           — clear cart
"""
from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity

from app import db
from app.models import Cart, CartItem, Product, Inventory
from app.api.v1.utils import customer_required, error_response, success_response
from app.services.pricing_service import compute_product_price

cart_bp = Blueprint("cart", __name__)


def _get_or_create_cart(customer_id: int) -> Cart:
    cart = Cart.query.filter_by(customer_id=customer_id).first()
    if not cart:
        cart = Cart(customer_id=customer_id)
        db.session.add(cart)
        db.session.flush()
    return cart


def _cart_response(cart: Cart) -> dict:
    items = []
    subtotal = 0

    for item in cart.items:
        p = item.product
        if not p or not p.is_active:
            continue

        try:
            price_info = compute_product_price(p)
            unit_price = float(price_info["total"])
        except Exception:
            unit_price = 0
            price_info = None

        line_total = unit_price * item.quantity
        subtotal += line_total

        primary = next((i for i in p.images if i.is_primary), p.images[0] if p.images else None)
        items.append({
            "cart_item_id": item.id,
            "product_id": p.id,
            "sku": p.sku,
            "name": p.name,
            "metal_type": p.metal_type,
            "purity": p.purity,
            "primary_image_url": primary.url if primary else None,
            "quantity": item.quantity,
            "stock": p.inventory.quantity if p.inventory else 0,
            "unit_price": str(round(unit_price, 2)),
            "line_total": str(round(line_total, 2)),
            "price_breakdown": price_info,
        })

    return {
        "cart_id": cart.id,
        "items": items,
        "item_count": len(items),
        "subtotal": str(round(subtotal, 2)),
    }


@cart_bp.get("")
@customer_required
def get_cart():
    cid = int(get_jwt_identity())
    cart = _get_or_create_cart(cid)
    db.session.commit()
    return success_response(_cart_response(cart))


@cart_bp.post("/items")
@customer_required
def add_item():
    cid = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    product_id = data.get("product_id")
    quantity = int(data.get("quantity", 1))

    if not product_id:
        return error_response("VALIDATION_ERROR", "product_id is required.")
    if quantity < 1:
        return error_response("VALIDATION_ERROR", "quantity must be at least 1.")

    product = Product.query.filter_by(id=product_id, is_active=True).first()
    if not product:
        return error_response("NOT_FOUND", "Product not found.", 404)

    inv = Inventory.query.filter_by(product_id=product_id).first()
    if not inv or inv.quantity < quantity:
        return error_response("OUT_OF_STOCK", "Insufficient stock for this product.", 422)

    cart = _get_or_create_cart(cid)
    existing = CartItem.query.filter_by(cart_id=cart.id, product_id=product_id).first()

    if existing:
        new_qty = existing.quantity + quantity
        if inv.quantity < new_qty:
            return error_response("OUT_OF_STOCK", "Insufficient stock.", 422)
        existing.quantity = new_qty
    else:
        item = CartItem(cart_id=cart.id, product_id=product_id, quantity=quantity)
        db.session.add(item)

    db.session.commit()
    return success_response(_cart_response(cart), 201)


@cart_bp.patch("/items/<int:item_id>")
@customer_required
def update_item(item_id):
    cid = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    quantity = int(data.get("quantity", 1))

    cart = Cart.query.filter_by(customer_id=cid).first()
    if not cart:
        return error_response("NOT_FOUND", "Cart not found.", 404)

    item = CartItem.query.filter_by(id=item_id, cart_id=cart.id).first()
    if not item:
        return error_response("NOT_FOUND", "Cart item not found.", 404)

    if quantity < 1:
        return error_response("VALIDATION_ERROR", "quantity must be at least 1.")

    inv = Inventory.query.filter_by(product_id=item.product_id).first()
    if not inv or inv.quantity < quantity:
        return error_response("OUT_OF_STOCK", "Insufficient stock.", 422)

    item.quantity = quantity
    db.session.commit()
    return success_response(_cart_response(cart))


@cart_bp.delete("/items/<int:item_id>")
@customer_required
def remove_item(item_id):
    cid = int(get_jwt_identity())
    cart = Cart.query.filter_by(customer_id=cid).first()
    if not cart:
        return error_response("NOT_FOUND", "Cart not found.", 404)

    item = CartItem.query.filter_by(id=item_id, cart_id=cart.id).first()
    if not item:
        return error_response("NOT_FOUND", "Cart item not found.", 404)

    db.session.delete(item)
    db.session.commit()
    return success_response(_cart_response(cart))


@cart_bp.delete("")
@customer_required
def clear_cart():
    cid = int(get_jwt_identity())
    cart = Cart.query.filter_by(customer_id=cid).first()
    if cart:
        CartItem.query.filter_by(cart_id=cart.id).delete()
        db.session.commit()
    return success_response({"message": "Cart cleared."})
