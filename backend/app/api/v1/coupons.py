"""Coupon endpoints."""
from datetime import datetime, timezone
from decimal import Decimal

from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity

from app import db
from app.models import Coupon, AdminRole
from app.api.v1.utils import admin_required, customer_required, error_response, success_response

coupons_bp = Blueprint("coupons", __name__)


def _coupon_dict(c: Coupon) -> dict:
    return {
        "id": c.id,
        "code": c.code,
        "description": c.description,
        "discount_type": c.discount_type,
        "discount_value": str(c.discount_value),
        "max_discount": str(c.max_discount) if c.max_discount else None,
        "min_order_amount": str(c.min_order_amount),
        "usage_limit": c.usage_limit,
        "usage_count": c.usage_count,
        "is_active": c.is_active,
        "valid_from": c.valid_from.isoformat() if c.valid_from else None,
        "valid_until": c.valid_until.isoformat() if c.valid_until else None,
        "created_at": c.created_at.isoformat(),
    }


@coupons_bp.post("/validate")
@customer_required
def validate_coupon():
    """Let customer validate a coupon code before checkout."""
    data = request.get_json(silent=True) or {}
    code = (data.get("code") or "").strip().upper()
    order_amount = Decimal(str(data.get("order_amount", "0")))

    if not code:
        return error_response("VALIDATION_ERROR", "code is required.")

    now = datetime.now(timezone.utc)
    coupon = Coupon.query.filter_by(code=code, is_active=True).first()
    if not coupon:
        return error_response("INVALID_COUPON", "Invalid or inactive coupon.", 422)
    if coupon.valid_until and now > coupon.valid_until.replace(tzinfo=None):
        return error_response("COUPON_EXPIRED", "This coupon has expired.", 422)
    if coupon.usage_limit and coupon.usage_count >= coupon.usage_limit:
        return error_response("COUPON_EXHAUSTED", "Coupon usage limit reached.", 422)
    if order_amount < Decimal(str(coupon.min_order_amount or 0)):
        return error_response("COUPON_MIN_ORDER", f"Minimum order ₹{coupon.min_order_amount} required.", 422)

    if coupon.discount_type == "percentage":
        discount = order_amount * Decimal(str(coupon.discount_value)) / 100
        if coupon.max_discount:
            discount = min(discount, Decimal(str(coupon.max_discount)))
    else:
        discount = min(Decimal(str(coupon.discount_value)), order_amount)

    return success_response({
        "valid": True,
        "code": coupon.code,
        "discount_type": coupon.discount_type,
        "discount_value": str(coupon.discount_value),
        "discount_amount": str(round(discount, 2)),
        "description": coupon.description,
    })


# ---- Admin ----

@coupons_bp.get("")
@admin_required()
def list_coupons():
    coupons = Coupon.query.order_by(Coupon.created_at.desc()).all()
    return success_response([_coupon_dict(c) for c in coupons])


@coupons_bp.post("")
@admin_required(allowed_roles=[AdminRole.SUPER_ADMIN, AdminRole.ADMIN])
def create_coupon():
    data = request.get_json(silent=True) or {}
    required = ["code", "discount_type", "discount_value"]
    for f in required:
        if not data.get(f):
            return error_response("VALIDATION_ERROR", f"'{f}' is required.")

    code = data["code"].strip().upper()
    if Coupon.query.filter_by(code=code).first():
        return error_response("CONFLICT", f"Coupon '{code}' already exists.", 409)

    admin_id = int(get_jwt_identity())
    coupon = Coupon(
        code=code,
        description=data.get("description", "").strip() or None,
        discount_type=data["discount_type"],
        discount_value=Decimal(str(data["discount_value"])),
        max_discount=Decimal(str(data["max_discount"])) if data.get("max_discount") else None,
        min_order_amount=Decimal(str(data.get("min_order_amount", "0"))),
        usage_limit=data.get("usage_limit"),
        is_active=data.get("is_active", True),
        valid_from=datetime.fromisoformat(data["valid_from"]) if data.get("valid_from") else None,
        valid_until=datetime.fromisoformat(data["valid_until"]) if data.get("valid_until") else None,
        created_by_admin_id=admin_id,
    )
    db.session.add(coupon)
    db.session.commit()
    return success_response(_coupon_dict(coupon), 201)


@coupons_bp.put("/<int:coupon_id>")
@admin_required(allowed_roles=[AdminRole.SUPER_ADMIN, AdminRole.ADMIN])
def update_coupon(coupon_id):
    coupon = Coupon.query.get_or_404(coupon_id)
    data = request.get_json(silent=True) or {}
    for f in ["description", "discount_type"]:
        if f in data:
            setattr(coupon, f, data[f])
    for f in ["discount_value", "max_discount", "min_order_amount"]:
        if f in data and data[f] is not None:
            setattr(coupon, f, Decimal(str(data[f])))
    if "is_active" in data:
        coupon.is_active = bool(data["is_active"])
    if "usage_limit" in data:
        coupon.usage_limit = data["usage_limit"]
    if "valid_from" in data and data["valid_from"]:
        coupon.valid_from = datetime.fromisoformat(data["valid_from"])
    if "valid_until" in data and data["valid_until"]:
        coupon.valid_until = datetime.fromisoformat(data["valid_until"])
    db.session.commit()
    return success_response(_coupon_dict(coupon))


@coupons_bp.delete("/<int:coupon_id>")
@admin_required(allowed_roles=[AdminRole.SUPER_ADMIN, AdminRole.ADMIN])
def delete_coupon(coupon_id):
    coupon = Coupon.query.get_or_404(coupon_id)
    coupon.is_active = False
    db.session.commit()
    return success_response({"message": "Coupon deactivated."})
