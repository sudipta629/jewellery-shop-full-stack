"""Banner endpoints."""
from datetime import datetime

from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity

from app import db
from app.models import Banner, AdminRole
from app.api.v1.utils import admin_required, error_response, success_response

banners_bp = Blueprint("banners", __name__)


def _banner_dict(b: Banner) -> dict:
    return {
        "id": b.id,
        "title": b.title,
        "subtitle": b.subtitle,
        "cta_text": b.cta_text,
        "cta_url": b.cta_url,
        "image_url": b.image_url,
        "is_active": b.is_active,
        "sort_order": b.sort_order,
        "starts_at": b.starts_at.isoformat() if b.starts_at else None,
        "ends_at": b.ends_at.isoformat() if b.ends_at else None,
    }


@banners_bp.get("")
def list_banners():
    """Public: return active banners ordered by sort_order."""
    banners = (
        Banner.query.filter_by(is_active=True)
        .order_by(Banner.sort_order, Banner.created_at)
        .all()
    )
    return success_response([_banner_dict(b) for b in banners])


@banners_bp.post("")
@admin_required(allowed_roles=[AdminRole.SUPER_ADMIN, AdminRole.ADMIN])
def create_banner():
    data = request.get_json(silent=True) or {}
    if not data.get("title") or not data.get("image_url"):
        return error_response("VALIDATION_ERROR", "title and image_url are required.")

    admin_id = int(get_jwt_identity())
    banner = Banner(
        title=data["title"].strip(),
        subtitle=data.get("subtitle", "").strip() or None,
        cta_text=data.get("cta_text", "").strip() or None,
        cta_url=data.get("cta_url", "").strip() or None,
        image_url=data["image_url"].strip(),
        is_active=data.get("is_active", True),
        sort_order=data.get("sort_order", 0),
        starts_at=datetime.fromisoformat(data["starts_at"]) if data.get("starts_at") else None,
        ends_at=datetime.fromisoformat(data["ends_at"]) if data.get("ends_at") else None,
        created_by_admin_id=admin_id,
    )
    db.session.add(banner)
    db.session.commit()
    return success_response(_banner_dict(banner), 201)


@banners_bp.put("/<int:banner_id>")
@admin_required(allowed_roles=[AdminRole.SUPER_ADMIN, AdminRole.ADMIN])
def update_banner(banner_id):
    banner = Banner.query.get_or_404(banner_id)
    data = request.get_json(silent=True) or {}
    for f in ["title", "subtitle", "cta_text", "cta_url", "image_url"]:
        if f in data:
            setattr(banner, f, (data[f] or "").strip() or None)
    if "is_active" in data:
        banner.is_active = bool(data["is_active"])
    if "sort_order" in data:
        banner.sort_order = int(data["sort_order"])
    db.session.commit()
    return success_response(_banner_dict(banner))


@banners_bp.delete("/<int:banner_id>")
@admin_required(allowed_roles=[AdminRole.SUPER_ADMIN, AdminRole.ADMIN])
def delete_banner(banner_id):
    banner = Banner.query.get_or_404(banner_id)
    db.session.delete(banner)
    db.session.commit()
    return success_response({"message": "Banner deleted."})
