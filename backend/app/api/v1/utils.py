"""Shared utilities: response helpers, decorators, pagination."""
from functools import wraps

from flask import jsonify, request
from flask_jwt_extended import get_jwt, verify_jwt_in_request

from app.models import AdminRole


# ---------------------------------------------------------------------------
# Response helpers
# ---------------------------------------------------------------------------

def success_response(data, status_code: int = 200):
    return jsonify({"data": data}), status_code


def error_response(code: str, message: str, status_code: int = 400):
    return jsonify({"error": {"code": code, "message": message}}), status_code


def paginated_response(items, total: int, page: int, per_page: int):
    return jsonify({
        "data": items,
        "pagination": {
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": (total + per_page - 1) // per_page,
        }
    })


# ---------------------------------------------------------------------------
# Pagination helper
# ---------------------------------------------------------------------------

def get_pagination_params():
    try:
        page = max(1, int(request.args.get("page", 1)))
        per_page = min(100, max(1, int(request.args.get("per_page", 20))))
    except (ValueError, TypeError):
        page, per_page = 1, 20
    return page, per_page


# ---------------------------------------------------------------------------
# RBAC decorators
# ---------------------------------------------------------------------------

def admin_required(allowed_roles: list = None):
    """
    Decorator: verifies JWT and checks the admin role stored in the token claims.
    Usage:
        @admin_required()
        @admin_required(allowed_roles=[AdminRole.SUPER_ADMIN])
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            if claims.get("type") != "admin":
                return error_response("FORBIDDEN", "Admin access required.", 403)
            if allowed_roles is not None:
                role = claims.get("role")
                allowed_values = [r.value if isinstance(r, AdminRole) else r for r in allowed_roles]
                if role not in allowed_values:
                    return error_response("FORBIDDEN", "Insufficient permissions.", 403)
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def customer_required(fn):
    """Decorator: verifies JWT and confirms the token belongs to a customer."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        claims = get_jwt()
        if claims.get("type") != "customer":
            return error_response("FORBIDDEN", "Customer access required.", 403)
        return fn(*args, **kwargs)
    return wrapper
