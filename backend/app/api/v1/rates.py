"""
Metal rate endpoints.

GET  /api/v1/rates              — current rates (public)
GET  /api/v1/rates/history      — historical rates (admin)
POST /api/v1/rates              — set rate (admin)
"""
from datetime import date

from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity

from app import db
from app.models import MetalRate, AdminRole
from app.api.v1.utils import admin_required, error_response, success_response

rates_bp = Blueprint("rates", __name__)

# Canonical metal+purity combinations displayed on user site
DISPLAY_RATES = [
    ("gold", "24K"),
    ("gold", "22K"),
    ("gold", "18K"),
    ("silver", "999"),
]


def _rate_dict(r: MetalRate) -> dict:
    return {
        "id": r.id,
        "metal": r.metal,
        "purity": r.purity,
        "rate_per_gram": str(r.rate_per_gram),
        "effective_date": r.effective_date.isoformat(),
        "updated_by": r.updated_by.full_name if r.updated_by else None,
        "created_at": r.created_at.isoformat(),
    }


@rates_bp.get("")
def get_current_rates():
    """Return the latest rate for each metal/purity combination."""
    result = []
    for metal, purity in DISPLAY_RATES:
        rate = (
            MetalRate.query
            .filter_by(metal=metal, purity=purity)
            .order_by(MetalRate.effective_date.desc(), MetalRate.id.desc())
            .first()
        )
        if rate:
            result.append(_rate_dict(rate))
        else:
            result.append({
                "metal": metal,
                "purity": purity,
                "rate_per_gram": None,
                "effective_date": None,
                "updated_by": None,
                "created_at": None,
            })
    return success_response(result)


@rates_bp.get("/history")
@admin_required()
def get_rate_history():
    metal = request.args.get("metal")
    purity = request.args.get("purity")
    query = MetalRate.query.order_by(MetalRate.effective_date.desc(), MetalRate.id.desc())
    if metal:
        query = query.filter(MetalRate.metal.ilike(metal))
    if purity:
        query = query.filter_by(purity=purity)
    rates = query.limit(200).all()
    return success_response([_rate_dict(r) for r in rates])


@rates_bp.post("")
@admin_required(allowed_roles=[AdminRole.SUPER_ADMIN, AdminRole.ADMIN])
def set_rate():
    data = request.get_json(silent=True) or {}
    metal = (data.get("metal") or "").strip().lower()
    purity = (data.get("purity") or "").strip()
    rate_value = data.get("rate_per_gram")

    if not metal or not purity or rate_value is None:
        return error_response("VALIDATION_ERROR", "metal, purity and rate_per_gram are required.")

    from decimal import Decimal
    try:
        rate_decimal = Decimal(str(rate_value))
        if rate_decimal <= 0:
            raise ValueError()
    except Exception:
        return error_response("VALIDATION_ERROR", "rate_per_gram must be a positive number.")

    admin_id = int(get_jwt_identity())
    effective = date.fromisoformat(data["effective_date"]) if data.get("effective_date") else date.today()

    rate_record = MetalRate(
        metal=metal,
        purity=purity,
        rate_per_gram=rate_decimal,
        effective_date=effective,
        updated_by_admin_id=admin_id,
    )
    db.session.add(rate_record)
    db.session.commit()
    return success_response(_rate_dict(rate_record), 201)
