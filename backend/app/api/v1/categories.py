"""
Category endpoints (public reads + admin writes).

GET  /api/v1/categories          — list active categories (public)
GET  /api/v1/categories/<id>     — get category detail (public)
POST /api/v1/categories          — create (admin)
PUT  /api/v1/categories/<id>     — update (admin)
DELETE /api/v1/categories/<id>   — soft-delete (admin)
"""
import re

from flask import Blueprint, request

from app import db
from app.models import Category, AdminRole
from app.api.v1.utils import admin_required, error_response, success_response

categories_bp = Blueprint("categories", __name__)


def _slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-")


def _category_dict(cat: Category) -> dict:
    return {
        "id": cat.id,
        "name": cat.name,
        "slug": cat.slug,
        "description": cat.description,
        "image_url": cat.image_url,
        "is_active": cat.is_active,
        "sort_order": cat.sort_order,
    }


# ---- Public ----

@categories_bp.get("")
def list_categories():
    include_inactive = request.args.get("include_inactive", "false").lower() == "true"
    query = Category.query.order_by(Category.sort_order, Category.name)
    if not include_inactive:
        query = query.filter_by(is_active=True)
    cats = query.all()
    return success_response([_category_dict(c) for c in cats])


@categories_bp.get("/<int:cat_id>")
def get_category(cat_id):
    cat = Category.query.get_or_404(cat_id)
    return success_response(_category_dict(cat))


# ---- Admin ----

@categories_bp.post("")
@admin_required(allowed_roles=[AdminRole.SUPER_ADMIN, AdminRole.ADMIN])
def create_category():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return error_response("VALIDATION_ERROR", "Category name is required.")

    if Category.query.filter_by(name=name).first():
        return error_response("CONFLICT", f"Category '{name}' already exists.", 409)

    slug = _slugify(name)
    # ensure slug uniqueness
    base_slug = slug
    counter = 1
    while Category.query.filter_by(slug=slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    cat = Category(
        name=name,
        slug=slug,
        description=data.get("description", "").strip() or None,
        image_url=data.get("image_url", "").strip() or None,
        is_active=data.get("is_active", True),
        sort_order=data.get("sort_order", 0),
    )
    db.session.add(cat)
    db.session.commit()
    return success_response(_category_dict(cat), 201)


@categories_bp.put("/<int:cat_id>")
@admin_required(allowed_roles=[AdminRole.SUPER_ADMIN, AdminRole.ADMIN])
def update_category(cat_id):
    cat = Category.query.get_or_404(cat_id)
    data = request.get_json(silent=True) or {}

    if "name" in data and data["name"].strip():
        new_name = data["name"].strip()
        existing = Category.query.filter_by(name=new_name).first()
        if existing and existing.id != cat_id:
            return error_response("CONFLICT", f"Category '{new_name}' already exists.", 409)
        cat.name = new_name
        cat.slug = _slugify(new_name)

    if "description" in data:
        cat.description = (data["description"] or "").strip() or None
    if "image_url" in data:
        cat.image_url = (data["image_url"] or "").strip() or None
    if "is_active" in data:
        cat.is_active = bool(data["is_active"])
    if "sort_order" in data:
        cat.sort_order = int(data["sort_order"])

    db.session.commit()
    return success_response(_category_dict(cat))


@categories_bp.delete("/<int:cat_id>")
@admin_required(allowed_roles=[AdminRole.SUPER_ADMIN, AdminRole.ADMIN])
def delete_category(cat_id):
    cat = Category.query.get_or_404(cat_id)
    # Prevent deletion if products are linked
    if cat.products.count() > 0:
        return error_response(
            "CONFLICT",
            "Cannot delete category with existing products. Deactivate it instead.",
            409,
        )
    cat.is_active = False
    db.session.commit()
    return success_response({"message": "Category deactivated."})
