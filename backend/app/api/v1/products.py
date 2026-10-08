"""
Product endpoints.

GET  /api/v1/products              — list (public, with filters/search/pagination)
GET  /api/v1/products/<id>         — detail (public)
POST /api/v1/products              — create (admin)
PUT  /api/v1/products/<id>         — update (admin)
DELETE /api/v1/products/<id>       — archive (admin)
GET  /api/v1/products/<id>/price   — computed price breakdown (public)
"""
from decimal import Decimal

from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity

from app import db
from app.models import Product, ProductImage, Inventory, MetalRate, AdminRole, Category
from app.api.v1.utils import admin_required, error_response, success_response, get_pagination_params, paginated_response
from app.services.pricing_service import compute_product_price

products_bp = Blueprint("products", __name__)


def _image_dict(img: ProductImage) -> dict:
    return {
        "id": img.id,
        "url": img.url,
        "alt_text": img.alt_text,
        "is_primary": img.is_primary,
        "sort_order": img.sort_order,
    }


def _product_dict(p: Product, include_price: bool = False) -> dict:
    primary_image = next((i for i in p.images if i.is_primary), p.images[0] if p.images else None)
    data = {
        "id": p.id,
        "sku": p.sku,
        "name": p.name,
        "description": p.description,
        "category_id": p.category_id,
        "category_name": p.category.name if p.category else None,
        "metal_type": p.metal_type,
        "purity": p.purity,
        "gross_weight": str(p.gross_weight) if p.gross_weight else None,
        "net_weight": str(p.net_weight) if p.net_weight else None,
        "making_charge_per_gram": str(p.making_charge_per_gram),
        "making_charge_percent": str(p.making_charge_percent),
        "stone_charge": str(p.stone_charge),
        "wastage_percent": str(p.wastage_percent),
        "tax_percent": str(p.tax_percent),
        "is_featured": p.is_featured,
        "is_new_arrival": p.is_new_arrival,
        "is_active": p.is_active,
        "gender": p.gender,
        "occasion": p.occasion,
        "care_info": p.care_info,
        "primary_image_url": primary_image.url if primary_image else None,
        "images": [_image_dict(i) for i in p.images],
        "stock": p.inventory.quantity if p.inventory else 0,
        "in_stock": (p.inventory.quantity > 0) if p.inventory else False,
        "created_at": p.created_at.isoformat(),
    }
    if include_price:
        try:
            price_info = compute_product_price(p)
            data["price"] = price_info
        except Exception:
            data["price"] = None
    return data


# ---- Public list ----

@products_bp.get("")
def list_products():
    page, per_page = get_pagination_params()

    query = Product.query.filter_by(is_active=True)

    # Search
    search = request.args.get("q", "").strip()
    if search:
        query = query.filter(
            db.or_(
                Product.name.ilike(f"%{search}%"),
                Product.sku.ilike(f"%{search}%"),
                Product.description.ilike(f"%{search}%"),
            )
        )

    # Filters
    if request.args.get("category_id"):
        query = query.filter_by(category_id=int(request.args["category_id"]))

    if request.args.get("category_slug"):
        cat = Category.query.filter_by(slug=request.args["category_slug"]).first()
        if cat:
            query = query.filter_by(category_id=cat.id)
        else:
            query = query.filter(db.false())

    if request.args.get("metal_type"):
        query = query.filter(Product.metal_type.ilike(request.args["metal_type"]))

    if request.args.get("purity"):
        query = query.filter(Product.purity.ilike(request.args["purity"]))

    if request.args.get("gender"):
        query = query.filter(Product.gender.ilike(request.args["gender"]))

    if request.args.get("occasion"):
        query = query.filter(Product.occasion.ilike(request.args["occasion"]))

    if request.args.get("is_featured") == "true":
        query = query.filter_by(is_featured=True)

    if request.args.get("is_new_arrival") == "true":
        query = query.filter_by(is_new_arrival=True)

    if request.args.get("in_stock") == "true":
        query = query.join(Inventory).filter(Inventory.quantity > 0)

    # Sorting
    sort = request.args.get("sort", "created_at_desc")
    sort_map = {
        "created_at_desc": Product.created_at.desc(),
        "created_at_asc": Product.created_at.asc(),
        "name_asc": Product.name.asc(),
        "name_desc": Product.name.desc(),
    }
    query = query.order_by(sort_map.get(sort, Product.created_at.desc()))

    total = query.count()
    products = query.offset((page - 1) * per_page).limit(per_page).all()

    return paginated_response(
        [_product_dict(p, include_price=True) for p in products],
        total, page, per_page,
    )


@products_bp.get("/<int:product_id>")
def get_product(product_id):
    p = Product.query.filter_by(id=product_id, is_active=True).first()
    if not p:
        return error_response("NOT_FOUND", "Product not found.", 404)
    return success_response(_product_dict(p, include_price=True))


@products_bp.get("/<int:product_id>/price")
def get_product_price(product_id):
    p = Product.query.filter_by(id=product_id, is_active=True).first()
    if not p:
        return error_response("NOT_FOUND", "Product not found.", 404)
    try:
        price_info = compute_product_price(p)
    except ValueError as exc:
        return error_response("PRICE_UNAVAILABLE", str(exc), 422)
    return success_response(price_info)


# ---- Admin ----

@products_bp.get("/admin/all")
@admin_required()
def admin_list_products():
    page, per_page = get_pagination_params()
    query = Product.query

    search = request.args.get("q", "").strip()
    if search:
        query = query.filter(
            db.or_(
                Product.name.ilike(f"%{search}%"),
                Product.sku.ilike(f"%{search}%"),
            )
        )

    if request.args.get("category_id"):
        query = query.filter_by(category_id=int(request.args["category_id"]))

    if request.args.get("is_active") in ("true", "false"):
        query = query.filter_by(is_active=request.args["is_active"] == "true")

    total = query.count()
    products = query.order_by(Product.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return paginated_response([_product_dict(p) for p in products], total, page, per_page)


@products_bp.post("")
@admin_required(allowed_roles=[AdminRole.SUPER_ADMIN, AdminRole.ADMIN])
def create_product():
    data = request.get_json(silent=True) or {}

    required = ["sku", "name", "category_id", "metal_type"]
    for field in required:
        if not data.get(field):
            return error_response("VALIDATION_ERROR", f"'{field}' is required.")

    if Product.query.filter_by(sku=data["sku"].strip()).first():
        return error_response("CONFLICT", f"SKU '{data['sku']}' already exists.", 409)

    p = Product(
        sku=data["sku"].strip().upper(),
        name=data["name"].strip(),
        description=data.get("description", "").strip() or None,
        category_id=data["category_id"],
        metal_type=data["metal_type"].strip(),
        purity=data.get("purity", "").strip() or None,
        gross_weight=Decimal(str(data["gross_weight"])) if data.get("gross_weight") else None,
        net_weight=Decimal(str(data["net_weight"])) if data.get("net_weight") else None,
        making_charge_per_gram=Decimal(str(data.get("making_charge_per_gram", "0"))),
        making_charge_percent=Decimal(str(data.get("making_charge_percent", "0"))),
        stone_charge=Decimal(str(data.get("stone_charge", "0"))),
        wastage_percent=Decimal(str(data.get("wastage_percent", "0"))),
        tax_percent=Decimal(str(data.get("tax_percent", "3"))),
        is_featured=data.get("is_featured", False),
        is_new_arrival=data.get("is_new_arrival", False),
        is_active=data.get("is_active", True),
        gender=data.get("gender"),
        occasion=data.get("occasion"),
        care_info=data.get("care_info", "").strip() or None,
    )
    db.session.add(p)
    db.session.flush()

    # Create inventory record
    inventory = Inventory(product_id=p.id, quantity=data.get("stock", 0))
    db.session.add(inventory)

    # Process images
    images = data.get("images", [])
    if isinstance(images, list):
        for idx, img_url in enumerate(images):
            pi = ProductImage(url=img_url, is_primary=(idx==0), sort_order=idx)
            p.images.append(pi)

    db.session.commit()
    return success_response(_product_dict(p), 201)


@products_bp.put("/<int:product_id>")
@admin_required(allowed_roles=[AdminRole.SUPER_ADMIN, AdminRole.ADMIN])
def update_product(product_id):
    p = Product.query.get_or_404(product_id)
    data = request.get_json(silent=True) or {}

    string_fields = ["name", "description", "metal_type", "purity", "gender", "occasion", "care_info"]
    decimal_fields = ["gross_weight", "net_weight", "making_charge_per_gram",
                      "making_charge_percent", "stone_charge", "wastage_percent", "tax_percent"]
    bool_fields = ["is_featured", "is_new_arrival", "is_active"]

    for f in string_fields:
        if f in data:
            setattr(p, f, (data[f] or "").strip() or None)

    for f in decimal_fields:
        if f in data and data[f] is not None:
            setattr(p, f, Decimal(str(data[f])))

    for f in bool_fields:
        if f in data:
            setattr(p, f, bool(data[f]))

    if "category_id" in data:
        p.category_id = data["category_id"]

    if "sku" in data:
        new_sku = data["sku"].strip().upper()
        existing = Product.query.filter_by(sku=new_sku).first()
        if existing and existing.id != product_id:
            return error_response("CONFLICT", f"SKU '{new_sku}' already exists.", 409)
        p.sku = new_sku

    if "images" in data and isinstance(data["images"], list):
        p.images.clear()
        for idx, img_url in enumerate(data["images"]):
            pi = ProductImage(url=img_url, is_primary=(idx==0), sort_order=idx)
            p.images.append(pi)

    db.session.commit()
    return success_response(_product_dict(p))


@products_bp.delete("/<int:product_id>")
@admin_required(allowed_roles=[AdminRole.SUPER_ADMIN, AdminRole.ADMIN])
def delete_product(product_id):
    p = Product.query.get_or_404(product_id)
    db.session.delete(p)
    db.session.commit()
    return success_response({"message": "Product deleted."})
