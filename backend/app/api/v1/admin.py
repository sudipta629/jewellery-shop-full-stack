"""Admin dashboard + customer management endpoints."""
from datetime import datetime, timedelta, timezone

from flask import Blueprint, request

from app import db
from app.models import (
    Customer, Order, Product, OrderStatus, PaymentStatus,
    OrderItem, AdminRole, Inventory,
)
from app.api.v1.utils import admin_required, error_response, success_response, get_pagination_params, paginated_response

admin_bp = Blueprint("admin", __name__)


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

@admin_bp.get("/dashboard")
@admin_required()
def dashboard():
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)

    total_customers = Customer.query.count()
    total_products = Product.query.filter_by(is_active=True).count()
    total_orders = Order.query.count()
    pending_orders = Order.query.filter_by(status=OrderStatus.PLACED).count()

    # Total sales (paid orders only)
    from sqlalchemy import func
    total_sales = db.session.query(func.sum(Order.total_amount)).filter(
        Order.payment_status == PaymentStatus.PAID
    ).scalar() or 0

    # Sales last 7 days
    daily_sales = (
        db.session.query(
            func.date(Order.placed_at).label("date"),
            func.sum(Order.total_amount).label("total"),
        )
        .filter(Order.placed_at >= week_ago)
        .group_by(func.date(Order.placed_at))
        .order_by(func.date(Order.placed_at))
        .all()
    )

    # Top products by quantity sold
    top_products = (
        db.session.query(
            OrderItem.product_id,
            OrderItem.product_name,
            func.sum(OrderItem.quantity).label("qty"),
            func.sum(OrderItem.line_total).label("revenue"),
        )
        .group_by(OrderItem.product_id, OrderItem.product_name)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(5)
        .all()
    )

    # Low stock
    low_stock = (
        db.session.query(Inventory, Product)
        .join(Product, Product.id == Inventory.product_id)
        .filter(Inventory.quantity <= Inventory.low_stock_threshold, Product.is_active == True)
        .limit(10)
        .all()
    )

    # Recent orders
    recent_orders = (
        Order.query.order_by(Order.placed_at.desc()).limit(5).all()
    )

    return success_response({
        "stats": {
            "total_sales": str(total_sales),
            "total_orders": total_orders,
            "total_customers": total_customers,
            "total_products": total_products,
            "pending_orders": pending_orders,
            "low_stock_count": len(low_stock),
        },
        "sales_chart": [
            {"date": str(r.date), "total": str(r.total)} for r in daily_sales
        ],
        "top_products": [
            {
                "product_id": r.product_id,
                "product_name": r.product_name,
                "qty_sold": int(r.qty),
                "revenue": str(r.revenue),
            }
            for r in top_products
        ],
        "low_stock_alerts": [
            {
                "product_id": inv.product_id,
                "product_name": p.name,
                "sku": p.sku,
                "quantity": inv.quantity,
                "threshold": inv.low_stock_threshold,
            }
            for inv, p in low_stock
        ],
        "recent_orders": [
            {
                "id": o.id,
                "order_number": o.order_number,
                "status": o.status.value,
                "total_amount": str(o.total_amount),
                "placed_at": o.placed_at.isoformat(),
            }
            for o in recent_orders
        ],
    })


# ---------------------------------------------------------------------------
# Customer Management
# ---------------------------------------------------------------------------

@admin_bp.get("/customers")
@admin_required()
def list_customers():
    page, per_page = get_pagination_params()
    query = Customer.query.order_by(Customer.created_at.desc())

    if request.args.get("q"):
        q = request.args["q"]
        query = query.filter(
            db.or_(
                Customer.email.ilike(f"%{q}%"),
                Customer.full_name.ilike(f"%{q}%"),
                Customer.phone.ilike(f"%{q}%"),
            )
        )
    if request.args.get("is_active") in ("true", "false"):
        query = query.filter_by(is_active=request.args["is_active"] == "true")

    total = query.count()
    customers = query.offset((page - 1) * per_page).limit(per_page).all()
    return paginated_response(
        [
            {
                "id": c.id,
                "email": c.email,
                "phone": c.phone,
                "full_name": c.full_name,
                "is_active": c.is_active,
                "is_email_verified": c.is_email_verified,
                "order_count": c.orders.count(),
                "created_at": c.created_at.isoformat(),
                "last_login_at": c.last_login_at.isoformat() if c.last_login_at else None,
            }
            for c in customers
        ],
        total, page, per_page,
    )


@admin_bp.get("/customers/<int:cid>")
@admin_required()
def get_customer(cid):
    c = Customer.query.get_or_404(cid)
    orders = c.orders.order_by(Order.placed_at.desc()).limit(10).all()
    return success_response({
        "id": c.id,
        "email": c.email,
        "phone": c.phone,
        "full_name": c.full_name,
        "is_active": c.is_active,
        "is_email_verified": c.is_email_verified,
        "is_phone_verified": c.is_phone_verified,
        "created_at": c.created_at.isoformat(),
        "last_login_at": c.last_login_at.isoformat() if c.last_login_at else None,
        "recent_orders": [
            {
                "id": o.id,
                "order_number": o.order_number,
                "status": o.status.value,
                "total_amount": str(o.total_amount),
                "placed_at": o.placed_at.isoformat(),
            }
            for o in orders
        ],
    })


@admin_bp.patch("/customers/<int:cid>/status")
@admin_required(allowed_roles=[AdminRole.SUPER_ADMIN, AdminRole.ADMIN])
def toggle_customer_status(cid):
    c = Customer.query.get_or_404(cid)
    c.is_active = not c.is_active
    db.session.commit()
    return success_response({"is_active": c.is_active})


# ---------------------------------------------------------------------------
# Admin Order Management
# ---------------------------------------------------------------------------

@admin_bp.get("/orders")
@admin_required()
def admin_list_orders():
    page, per_page = get_pagination_params()
    query = Order.query.order_by(Order.placed_at.desc())

    if request.args.get("status"):
        try:
            query = query.filter_by(status=OrderStatus(request.args["status"]))
        except ValueError:
            pass
    if request.args.get("payment_status"):
        try:
            query = query.filter_by(payment_status=PaymentStatus(request.args["payment_status"]))
        except ValueError:
            pass
    if request.args.get("q"):
        q = request.args["q"]
        query = query.filter(Order.order_number.ilike(f"%{q}%"))

    total = query.count()
    orders = query.offset((page - 1) * per_page).limit(per_page).all()
    return paginated_response(
        [
            {
                "id": o.id,
                "order_number": o.order_number,
                "customer_id": o.customer_id,
                "customer_email": o.customer.email if o.customer else None,
                "status": o.status.value,
                "payment_method": o.payment_method.value,
                "payment_status": o.payment_status.value,
                "total_amount": str(o.total_amount),
                "placed_at": o.placed_at.isoformat(),
            }
            for o in orders
        ],
        total, page, per_page,
    )


@admin_bp.patch("/orders/<int:order_id>/status")
@admin_required(allowed_roles=[AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.SALES_STAFF])
def update_order_status(order_id):
    from flask_jwt_extended import get_jwt_identity
    from app.models import OrderStatusHistory
    order = Order.query.get_or_404(order_id)
    data = request.get_json(silent=True) or {}
    try:
        new_status = OrderStatus(data.get("status", ""))
    except ValueError:
        return error_response("VALIDATION_ERROR", f"Invalid status.")

    admin_id = int(get_jwt_identity())
    order.status = new_status
    sh = OrderStatusHistory(
        order_id=order.id,
        status=new_status,
        note=data.get("note", "").strip() or None,
        changed_by_admin_id=admin_id,
    )
    db.session.add(sh)
    db.session.commit()
    return success_response({"status": new_status.value})


@admin_bp.get("/orders/<int:order_id>")
@admin_required()
def admin_get_order(order_id):
    from app.models import OrderItem, OrderStatusHistory
    order = Order.query.get_or_404(order_id)
    return success_response({
        "id": order.id,
        "order_number": order.order_number,
        "customer_id": order.customer_id,
        "customer_email": order.customer.email if order.customer else None,
        "customer_name": order.customer.full_name if order.customer else None,
        "customer_phone": order.customer.phone if order.customer else None,
        "status": order.status.value,
        "payment_method": order.payment_method.value,
        "payment_status": order.payment_status.value,
        "subtotal": str(order.subtotal),
        "discount_amount": str(order.discount_amount),
        "coupon_code": order.coupon_code,
        "shipping_charge": str(order.shipping_charge),
        "tax_amount": str(order.tax_amount),
        "total_amount": str(order.total_amount),
        "address_snapshot": order.address_snapshot,
        "notes": order.notes,
        "placed_at": order.placed_at.isoformat(),
        "updated_at": order.updated_at.isoformat(),
        "items": [
            {
                "id": oi.id,
                "product_id": oi.product_id,
                "product_name": oi.product_name,
                "product_sku": oi.product_sku,
                "metal_type": oi.metal_type,
                "purity": oi.purity,
                "quantity": oi.quantity,
                "unit_price": str(oi.unit_price),
                "line_total": str(oi.line_total),
                "making_charge": str(oi.making_charge),
                "stone_charge": str(oi.stone_charge),
                "tax_amount": str(oi.tax_amount),
            }
            for oi in order.items
        ],
        "status_history": [
            {
                "status": sh.status.value,
                "note": sh.note,
                "changed_by": sh.changed_by.full_name if sh.changed_by else None,
                "created_at": sh.created_at.isoformat(),
            }
            for sh in order.status_history
        ],
    })
