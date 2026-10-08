"""
Admin authentication endpoints.

POST /api/v1/admin/auth/login    — email + password login
POST /api/v1/admin/auth/refresh  — refresh access token
POST /api/v1/admin/auth/logout   — logout
GET  /api/v1/admin/auth/me       — current admin profile
"""
from datetime import datetime, timezone

from flask import Blueprint, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt,
    get_jwt_identity,
    jwt_required,
)
from werkzeug.security import check_password_hash

from app.models import Admin
from app.api.v1.utils import admin_required, error_response, success_response

admin_auth_bp = Blueprint("admin_auth", __name__)


def _make_admin_claims(admin: Admin) -> dict:
    return {
        "type": "admin",
        "role": admin.role.value,
    }


@admin_auth_bp.post("/login")
def admin_login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return error_response("VALIDATION_ERROR", "email and password are required.")

    admin = Admin.query.filter_by(email=email).first()
    if not admin or not admin.is_active:
        return error_response("INVALID_CREDENTIALS", "Invalid email or password.", 401)

    if not check_password_hash(admin.password_hash, password):
        return error_response("INVALID_CREDENTIALS", "Invalid email or password.", 401)

    admin.last_login_at = datetime.now(timezone.utc)
    from app import db
    db.session.commit()

    claims = _make_admin_claims(admin)
    access_token = create_access_token(identity=str(admin.id), additional_claims=claims)
    refresh_token = create_refresh_token(identity=str(admin.id), additional_claims=claims)

    return success_response({
        "access_token": access_token,
        "refresh_token": refresh_token,
        "admin": {
            "id": admin.id,
            "email": admin.email,
            "username": admin.username,
            "full_name": admin.full_name,
            "role": admin.role.value,
        },
    })


@admin_auth_bp.post("/refresh")
@jwt_required(refresh=True)
def admin_refresh():
    claims = get_jwt()
    if claims.get("type") != "admin":
        return error_response("FORBIDDEN", "Not an admin token.", 403)
    identity = get_jwt_identity()
    admin = Admin.query.get(int(identity))
    if not admin or not admin.is_active:
        return error_response("UNAUTHORIZED", "Admin not found or deactivated.", 401)
    access_token = create_access_token(
        identity=identity,
        additional_claims=_make_admin_claims(admin),
    )
    return success_response({"access_token": access_token})


@admin_auth_bp.post("/logout")
def admin_logout():
    return success_response({"message": "Logged out."})


@admin_auth_bp.get("/me")
@admin_required()
def admin_me():
    identity = get_jwt_identity()
    admin = Admin.query.get(int(identity))
    if not admin:
        return error_response("NOT_FOUND", "Admin not found.", 404)
    return success_response({
        "id": admin.id,
        "email": admin.email,
        "username": admin.username,
        "full_name": admin.full_name,
        "role": admin.role.value,
        "last_login_at": admin.last_login_at.isoformat() if admin.last_login_at else None,
    })
