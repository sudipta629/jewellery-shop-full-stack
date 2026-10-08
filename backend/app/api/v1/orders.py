"""
Order endpoints.

POST /api/v1/orders              — place order
GET  /api/v1/orders              — list my orders
GET  /api/v1/orders/<id>         — order detail
POST /api/v1/orders/<id>/cancel  — cancel order
"""
import uuid
from decimal import Decimal, ROUND_HALF_UP

from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity

from app import db
from app.models import (
    Cart, CartItem, Coupon, CouponUsage, Customer, Inventory, InventoryAction,
    InventoryTransaction, Order, OrderItem, OrderStatus, OrderStatusHistory,
    PaymentMethod, PaymentStatus, Product, Address, Notification, NotificationType,
)
from app.api.v1.utils import customer_required, error_response, success_response, get_pagination_params, paginated_response
from app.services.pricing_service import compute_order_item_snapshot

orders_bp = Blueprint("orders", __name__)

_TWO = Decimal("0.01")


def _order_dict(order: Order, include_items: bool = False) -> dict:
    data = {
        "id": order.id,
        "order_number": order.order_number,
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
    }
    if include_items:
        data["items"] = [
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
        ]
        data["status_history"] = [
            {
                "status": sh.status.value,
                "note": sh.note,
                "created_at": sh.created_at.isoformat(),
            }
            for sh in order.status_history
        ]
    return data


@orders_bp.get("")
@customer_required
def list_orders():
    cid = int(get_jwt_identity())
    page, per_page = get_pagination_params()
    query = Order.query.filter_by(customer_id=cid).order_by(Order.placed_at.desc())
    total = query.count()
    orders = query.offset((page - 1) * per_page).limit(per_page).all()
    return paginated_response([_order_dict(o) for o in orders], total, page, per_page)


@orders_bp.get("/<int:order_id>")
@customer_required
def get_order(order_id):
    cid = int(get_jwt_identity())
    order = Order.query.filter_by(id=order_id, customer_id=cid).first()
    if not order:
        return error_response("NOT_FOUND", "Order not found.", 404)
    return success_response(_order_dict(order, include_items=True))


@orders_bp.post("")
@customer_required
def place_order():
    cid = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    address_id = data.get("address_id")
    payment_method_raw = (data.get("payment_method") or "cod").strip()
    coupon_code = (data.get("coupon_code") or "").strip().upper() or None

    # Validate address ownership
    address = Address.query.filter_by(id=address_id, customer_id=cid).first()
    if not address:
        return error_response("VALIDATION_ERROR", "Valid address_id is required.")

    try:
        payment_method = PaymentMethod(payment_method_raw)
    except ValueError:
        return error_response("VALIDATION_ERROR", f"Invalid payment_method '{payment_method_raw}'.")

    # Load cart
    cart = Cart.query.filter_by(customer_id=cid).first()
    if not cart or not cart.items:
        return error_response("EMPTY_CART", "Your cart is empty.", 422)

    # Begin atomic block
    try:
        order_items_data = []
        subtotal = Decimal("0")

        for cart_item in cart.items:
            product = cart_item.product
            if not product or not product.is_active:
                return error_response("PRODUCT_UNAVAILABLE", f"Product '{product.name}' is no longer available.", 422)

            inv = Inventory.query.filter_by(product_id=product.id).with_for_update().first()
            if not inv or inv.quantity < cart_item.quantity:
                return error_response("OUT_OF_STOCK", f"Insufficient stock for '{product.name}'.", 422)

            try:
                snapshot = compute_order_item_snapshot(product, cart_item.quantity)
            except ValueError as price_err:
                db.session.rollback()
                return error_response(
                    "PRICE_UNAVAILABLE",
                    f"Could not calculate price for '{product.name}': {str(price_err)}",
                    422,
                )
            line_total = Decimal(snapshot["line_total"])
            subtotal += line_total
            order_items_data.append((product, cart_item.quantity, snapshot, inv))

        # Coupon validation
        discount_amount = Decimal("0")
        coupon = None
        if coupon_code:
            from datetime import datetime, timezone
            now = datetime.now(timezone.utc)
            coupon = Coupon.query.filter_by(code=coupon_code, is_active=True).first()
            if not coupon:
                return error_response("INVALID_COUPON", "Coupon code is invalid or inactive.", 422)
            if coupon.valid_until and now > coupon.valid_until.replace(tzinfo=None):
                return error_response("COUPON_EXPIRED", "This coupon has expired.", 422)
            if coupon.valid_from and now < coupon.valid_from.replace(tzinfo=None):
                return error_response("COUPON_NOT_YET_ACTIVE", "This coupon is not yet active.", 422)
            if coupon.usage_limit and coupon.usage_count >= coupon.usage_limit:
                return error_response("COUPON_EXHAUSTED", "This coupon has reached its usage limit.", 422)
            if subtotal < Decimal(str(coupon.min_order_amount or 0)):
                return error_response("COUPON_MIN_ORDER", f"Minimum order amount for this coupon is ₹{coupon.min_order_amount}.", 422)

            if coupon.discount_type == "percentage":
                discount_amount = (subtotal * Decimal(str(coupon.discount_value)) / 100)
                if coupon.max_discount:
                    discount_amount = min(discount_amount, Decimal(str(coupon.max_discount)))
            else:
                discount_amount = min(Decimal(str(coupon.discount_value)), subtotal)

            discount_amount = discount_amount.quantize(_TWO, rounding=ROUND_HALF_UP)

        taxable = subtotal - discount_amount
        tax_amount = Decimal("0")  # tax is already inside item prices; shipping is separate
        shipping_charge = Decimal("0")
        total_amount = (taxable + tax_amount + shipping_charge).quantize(_TWO, rounding=ROUND_HALF_UP)

        # Address snapshot
        address_snapshot = {
            "full_name": address.full_name,
            "phone": address.phone,
            "line1": address.line1,
            "line2": address.line2,
            "city": address.city,
            "state": address.state,
            "pincode": address.pincode,
            "country": address.country,
        }

        order_number = f"JWL{uuid.uuid4().hex[:8].upper()}"

        order = Order(
            order_number=order_number,
            customer_id=cid,
            address_snapshot=address_snapshot,
            subtotal=subtotal.quantize(_TWO, rounding=ROUND_HALF_UP),
            discount_amount=discount_amount,
            coupon_code=coupon_code,
            shipping_charge=shipping_charge,
            tax_amount=tax_amount,
            total_amount=total_amount,
            payment_method=payment_method,
            payment_status=PaymentStatus.PENDING,
            notes=data.get("notes", "").strip() or None,
        )
        db.session.add(order)
        db.session.flush()

        # Create order items + reduce inventory
        for product, quantity, snapshot, inv in order_items_data:
            oi = OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=quantity,
                product_name=snapshot["product_name"],
                product_sku=snapshot["product_sku"],
                metal_type=snapshot["metal_type"],
                purity=snapshot["purity"],
                net_weight=Decimal(snapshot["net_weight"]) if snapshot["net_weight"] else None,
                rate_per_gram=Decimal(snapshot["rate_per_gram"]),
                making_charge=Decimal(snapshot["making_charge"]),
                stone_charge=Decimal(snapshot["stone_charge"]),
                tax_amount=Decimal(snapshot["tax_amount"]),
                unit_price=Decimal(snapshot["unit_price"]),
                line_total=Decimal(snapshot["line_total"]),
            )
            db.session.add(oi)

            qty_before = inv.quantity
            inv.quantity -= quantity
            txn = InventoryTransaction(
                inventory_id=inv.id,
                action=InventoryAction.SALE,
                quantity_change=-quantity,
                quantity_after=inv.quantity,
                reason=f"Order {order_number}",
                reference_order_id=order.id,
            )
            db.session.add(txn)

        # Record initial status
        status_history = OrderStatusHistory(
            order_id=order.id,
            status=OrderStatus.PLACED,
            note="Order placed by customer.",
        )
        db.session.add(status_history)

        # Record coupon usage
        if coupon:
            coupon.usage_count += 1
            usage = CouponUsage(
                coupon_id=coupon.id,
                customer_id=cid,
                order_id=order.id,
                discount_applied=discount_amount,
            )
            db.session.add(usage)

        # Clear cart
        CartItem.query.filter_by(cart_id=cart.id).delete()

        # Notification
        notif = Notification(
            customer_id=cid,
            notification_type=NotificationType.ORDER,
            title="Order Placed!",
            message=f"Your order #{order_number} has been placed successfully.",
            reference_id=order.id,
            reference_type="order",
        )
        db.session.add(notif)

        db.session.commit()
        return success_response(_order_dict(order, include_items=True), 201)

    except Exception as exc:
        db.session.rollback()
        raise exc


@orders_bp.post("/<int:order_id>/cancel")
@customer_required
def cancel_order(order_id):
    cid = int(get_jwt_identity())
    order = Order.query.filter_by(id=order_id, customer_id=cid).first()
    if not order:
        return error_response("NOT_FOUND", "Order not found.", 404)

    cancellable = {OrderStatus.PLACED, OrderStatus.CONFIRMED}
    if order.status not in cancellable:
        return error_response(
            "CANCEL_NOT_ALLOWED",
            f"Orders with status '{order.status.value}' cannot be cancelled.",
            422,
        )

    order.status = OrderStatus.CANCELLED

    # Restore inventory
    for oi in order.items:
        inv = Inventory.query.filter_by(product_id=oi.product_id).first()
        if inv:
            inv.quantity += oi.quantity
            txn = InventoryTransaction(
                inventory_id=inv.id,
                action=InventoryAction.RETURN,
                quantity_change=oi.quantity,
                quantity_after=inv.quantity,
                reason=f"Cancellation of Order {order.order_number}",
                reference_order_id=order.id,
            )
            db.session.add(txn)

    sh = OrderStatusHistory(
        order_id=order.id,
        status=OrderStatus.CANCELLED,
        note="Cancelled by customer.",
    )
    db.session.add(sh)
    db.session.commit()
    return success_response({"message": "Order cancelled.", "order_number": order.order_number})
