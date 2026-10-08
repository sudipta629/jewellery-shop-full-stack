"""
Customer profile + address endpoints.

GET    /api/v1/customers/profile
PATCH  /api/v1/customers/profile
GET    /api/v1/customers/addresses
POST   /api/v1/customers/addresses
GET    /api/v1/customers/addresses/<id>
PUT    /api/v1/customers/addresses/<id>
DELETE /api/v1/customers/addresses/<id>
PATCH  /api/v1/customers/addresses/<id>/set-default
"""
from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity

from app import db
from app.models import Customer, Address
from app.api.v1.utils import customer_required, error_response, success_response

customers_bp = Blueprint("customers", __name__)


def _address_dict(addr: Address) -> dict:
    return {
        "id": addr.id,
        "label": addr.label,
        "full_name": addr.full_name,
        "phone": addr.phone,
        "line1": addr.line1,
        "line2": addr.line2,
        "city": addr.city,
        "state": addr.state,
        "pincode": addr.pincode,
        "country": addr.country,
        "is_default": addr.is_default,
        "created_at": addr.created_at.isoformat(),
    }


@customers_bp.get("/profile")
@customer_required
def get_profile():
    cid = int(get_jwt_identity())
    customer = Customer.query.get_or_404(cid)
    return success_response({
        "id": customer.id,
        "email": customer.email,
        "phone": customer.phone,
        "full_name": customer.full_name,
        "is_email_verified": customer.is_email_verified,
        "is_phone_verified": customer.is_phone_verified,
        "created_at": customer.created_at.isoformat(),
    })


@customers_bp.patch("/profile")
@customer_required
def update_profile():
    cid = int(get_jwt_identity())
    customer = Customer.query.get_or_404(cid)
    data = request.get_json(silent=True) or {}

    allowed_fields = {"full_name", "phone"}
    for field in allowed_fields:
        if field in data:
            value = (data[field] or "").strip() if isinstance(data[field], str) else data[field]
            setattr(customer, field, value or None)

    db.session.commit()
    return success_response({"message": "Profile updated."})


# ---- Addresses ----

@customers_bp.get("/addresses")
@customer_required
def list_addresses():
    cid = int(get_jwt_identity())
    addrs = Address.query.filter_by(customer_id=cid).order_by(Address.is_default.desc(), Address.created_at).all()
    return success_response([_address_dict(a) for a in addrs])


@customers_bp.post("/addresses")
@customer_required
def create_address():
    cid = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    required = ["full_name", "phone", "line1", "city", "state", "pincode"]
    for field in required:
        if not data.get(field):
            return error_response("VALIDATION_ERROR", f"'{field}' is required.")

    make_default = data.get("is_default", False)
    if make_default:
        Address.query.filter_by(customer_id=cid, is_default=True).update({"is_default": False})

    addr = Address(
        customer_id=cid,
        label=data.get("label", "Home"),
        full_name=data["full_name"].strip(),
        phone=data["phone"].strip(),
        line1=data["line1"].strip(),
        line2=data.get("line2", "").strip() or None,
        city=data["city"].strip(),
        state=data["state"].strip(),
        pincode=data["pincode"].strip(),
        country=data.get("country", "India").strip(),
        is_default=make_default,
    )
    db.session.add(addr)
    db.session.commit()
    return success_response(_address_dict(addr), 201)


@customers_bp.get("/addresses/<int:addr_id>")
@customer_required
def get_address(addr_id):
    cid = int(get_jwt_identity())
    addr = Address.query.filter_by(id=addr_id, customer_id=cid).first()
    if not addr:
        return error_response("NOT_FOUND", "Address not found.", 404)
    return success_response(_address_dict(addr))


@customers_bp.put("/addresses/<int:addr_id>")
@customer_required
def update_address(addr_id):
    cid = int(get_jwt_identity())
    addr = Address.query.filter_by(id=addr_id, customer_id=cid).first()
    if not addr:
        return error_response("NOT_FOUND", "Address not found.", 404)

    data = request.get_json(silent=True) or {}
    fields = ["label", "full_name", "phone", "line1", "line2", "city", "state", "pincode", "country"]
    for f in fields:
        if f in data:
            setattr(addr, f, (data[f] or "").strip() or None)

    if "is_default" in data and data["is_default"]:
        Address.query.filter_by(customer_id=cid, is_default=True).update({"is_default": False})
        addr.is_default = True

    db.session.commit()
    return success_response(_address_dict(addr))


@customers_bp.delete("/addresses/<int:addr_id>")
@customer_required
def delete_address(addr_id):
    cid = int(get_jwt_identity())
    addr = Address.query.filter_by(id=addr_id, customer_id=cid).first()
    if not addr:
        return error_response("NOT_FOUND", "Address not found.", 404)
    db.session.delete(addr)
    db.session.commit()
    return success_response({"message": "Address deleted."})


@customers_bp.patch("/addresses/<int:addr_id>/set-default")
@customer_required
def set_default_address(addr_id):
    cid = int(get_jwt_identity())
    addr = Address.query.filter_by(id=addr_id, customer_id=cid).first()
    if not addr:
        return error_response("NOT_FOUND", "Address not found.", 404)
    Address.query.filter_by(customer_id=cid, is_default=True).update({"is_default": False})
    addr.is_default = True
    db.session.commit()
    return success_response({"message": "Default address updated."})
