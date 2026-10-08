"""Wishlist endpoints."""
from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity

from app import db
from app.models import WishlistItem, Product
from app.api.v1.utils import customer_required, error_response, success_response
from app.services.pricing_service import compute_product_price

wishlist_bp = Blueprint("wishlist", __name__)


def _item_dict(wi: WishlistItem) -> dict:
    p = wi.product
    primary = next((i for i in p.images if i.is_primary), p.images[0] if p.images else None)
    try:
        price_info = compute_product_price(p)
        total = price_info["total"]
    except Exception:
        total = None

    return {
        "wishlist_item_id": wi.id,
        "product_id": p.id,
        "sku": p.sku,
        "name": p.name,
        "metal_type": p.metal_type,
        "purity": p.purity,
        "primary_image_url": primary.url if primary else None,
        "price": total,
        "in_stock": (p.inventory.quantity > 0) if p.inventory else False,
        "added_at": wi.added_at.isoformat(),
    }


@wishlist_bp.get("")
@customer_required
def get_wishlist():
    cid = int(get_jwt_identity())
    items = WishlistItem.query.filter_by(customer_id=cid).order_by(WishlistItem.added_at.desc()).all()
    return success_response([_item_dict(i) for i in items])


@wishlist_bp.post("")
@customer_required
def add_to_wishlist():
    cid = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    product_id = data.get("product_id")
    if not product_id:
        return error_response("VALIDATION_ERROR", "product_id is required.")

    product = Product.query.filter_by(id=product_id, is_active=True).first()
    if not product:
        return error_response("NOT_FOUND", "Product not found.", 404)

    existing = WishlistItem.query.filter_by(customer_id=cid, product_id=product_id).first()
    if existing:
        return error_response("CONFLICT", "Product already in wishlist.", 409)

    item = WishlistItem(customer_id=cid, product_id=product_id)
    db.session.add(item)
    db.session.commit()
    return success_response(_item_dict(item), 201)


@wishlist_bp.delete("/<int:product_id>")
@customer_required
def remove_from_wishlist(product_id):
    cid = int(get_jwt_identity())
    item = WishlistItem.query.filter_by(customer_id=cid, product_id=product_id).first()
    if not item:
        return error_response("NOT_FOUND", "Wishlist item not found.", 404)
    db.session.delete(item)
    db.session.commit()
    return success_response({"message": "Removed from wishlist."})
