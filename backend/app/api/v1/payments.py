"""Payment endpoints."""
from flask import Blueprint, request

from app import db
from app.models import Order, Payment, PaymentMethod, PaymentStatus, OrderStatus, AdminRole
from app.api.v1.utils import customer_required, admin_required, error_response, success_response

payments_bp = Blueprint("payments", __name__)


@payments_bp.post("/cod/<int:order_id>")
@customer_required
def confirm_cod(order_id):
    """Mark a COD order's payment as pending (confirmed by delivery)."""
    from flask_jwt_extended import get_jwt_identity
    cid = int(get_jwt_identity())
    order = Order.query.filter_by(id=order_id, customer_id=cid).first()
    if not order:
        return error_response("NOT_FOUND", "Order not found.", 404)

    if order.payment_method != PaymentMethod.COD:
        return error_response("INVALID_REQUEST", "This order is not a COD order.", 400)

    existing = Payment.query.filter_by(order_id=order.id).first()
    if not existing:
        payment = Payment(
            order_id=order.id,
            method=PaymentMethod.COD,
            status=PaymentStatus.PENDING,
            amount=order.total_amount,
            provider="cod",
        )
        db.session.add(payment)
        db.session.commit()
    return success_response({"message": "COD order confirmed. Payment due on delivery."})


@payments_bp.get("/admin/all")
@admin_required()
def admin_list_payments():
    from app.api.v1.utils import get_pagination_params, paginated_response
    page, per_page = get_pagination_params()
    query = Payment.query.order_by(Payment.created_at.desc())
    if request.args.get("status"):
        query = query.filter_by(status=PaymentStatus(request.args["status"]))
    total = query.count()
    payments = query.offset((page - 1) * per_page).limit(per_page).all()
    return paginated_response(
        [
            {
                "id": p.id,
                "order_id": p.order_id,
                "method": p.method.value,
                "status": p.status.value,
                "amount": str(p.amount),
                "provider": p.provider,
                "provider_payment_id": p.provider_payment_id,
                "paid_at": p.paid_at.isoformat() if p.paid_at else None,
                "created_at": p.created_at.isoformat(),
            }
            for p in payments
        ],
        total, page, per_page,
    )
