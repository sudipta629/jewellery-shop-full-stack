"""Offers endpoints."""
from datetime import datetime
from decimal import Decimal

from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity

from app import db
from app.models import Offer, AdminRole
from app.api.v1.utils import admin_required, error_response, success_response

offers_bp = Blueprint("offers", __name__)


def _offer_dict(o: Offer) -> dict:
    return {
        "id": o.id,
        "title": o.title,
        "description": o.description,
        "discount_type": o.discount_type,
        "discount_value": str(o.discount_value),
        "applies_to": o.applies_to,
        "category_id": o.category_id,
        "product_id": o.product_id,
        "is_active": o.is_active,
        "starts_at": o.starts_at.isoformat() if o.starts_at else None,
        "ends_at": o.ends_at.isoformat() if o.ends_at else None,
        "created_at": o.created_at.isoformat(),
    }


@offers_bp.get("")
def list_offers():
    """Public: list active current offers."""
    now = datetime.utcnow()
    query = Offer.query.filter_by(is_active=True)
    offers = query.order_by(Offer.created_at.desc()).all()
    return success_response([_offer_dict(o) for o in offers])


@offers_bp.get("/admin/all")
@admin_required(allowed_roles=[AdminRole.SUPER_ADMIN, AdminRole.ADMIN])
def list_all_offers():
    """Admin: list all offers including inactive."""
    offers = Offer.query.order_by(Offer.created_at.desc()).all()
    return success_response([_offer_dict(o) for o in offers])


@offers_bp.post("")
@admin_required(allowed_roles=[AdminRole.SUPER_ADMIN, AdminRole.ADMIN])
def create_offer():
    data = request.get_json(silent=True) or {}
    required = ["title", "discount_type", "discount_value"]
    for f in required:
        if not data.get(f):
            return error_response("VALIDATION_ERROR", f"'{f}' is required.")

    admin_id = int(get_jwt_identity())
    offer = Offer(
        title=data["title"].strip(),
        description=data.get("description", "").strip() or None,
        discount_type=data["discount_type"],
        discount_value=Decimal(str(data["discount_value"])),
        applies_to=data.get("applies_to", "all"),
        category_id=data.get("category_id"),
        product_id=data.get("product_id"),
        is_active=data.get("is_active", True),
        starts_at=datetime.fromisoformat(data["starts_at"]) if data.get("starts_at") else None,
        ends_at=datetime.fromisoformat(data["ends_at"]) if data.get("ends_at") else None,
        created_by_admin_id=admin_id,
    )
    db.session.add(offer)
    db.session.commit()
    return success_response(_offer_dict(offer), 201)


@offers_bp.put("/<int:offer_id>")
@admin_required(allowed_roles=[AdminRole.SUPER_ADMIN, AdminRole.ADMIN])
def update_offer(offer_id):
    offer = Offer.query.get_or_404(offer_id)
    data = request.get_json(silent=True) or {}
    for f in ["title", "description", "discount_type", "applies_to"]:
        if f in data:
            setattr(offer, f, data[f])
    if "discount_value" in data:
        offer.discount_value = Decimal(str(data["discount_value"]))
    if "is_active" in data:
        offer.is_active = bool(data["is_active"])
    if "category_id" in data:
        offer.category_id = data["category_id"]
    if "product_id" in data:
        offer.product_id = data["product_id"]
    if "starts_at" in data and data["starts_at"]:
        offer.starts_at = datetime.fromisoformat(data["starts_at"])
    if "ends_at" in data and data["ends_at"]:
        offer.ends_at = datetime.fromisoformat(data["ends_at"])
    db.session.commit()
    return success_response(_offer_dict(offer))


@offers_bp.delete("/<int:offer_id>")
@admin_required(allowed_roles=[AdminRole.SUPER_ADMIN, AdminRole.ADMIN])
def delete_offer(offer_id):
    offer = Offer.query.get_or_404(offer_id)
    offer.is_active = False
    db.session.commit()
    return success_response({"message": "Offer deactivated."})
