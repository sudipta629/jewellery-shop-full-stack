"""Inventory admin endpoints."""
from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity

from app import db
from app.models import Inventory, InventoryTransaction, InventoryAction, Product, AdminRole
from app.api.v1.utils import admin_required, error_response, success_response, get_pagination_params, paginated_response

inventory_bp = Blueprint("inventory", __name__)


def _inv_dict(inv: Inventory) -> dict:
    p = inv.product
    return {
        "id": inv.id,
        "product_id": inv.product_id,
        "product_name": p.name if p else None,
        "sku": p.sku if p else None,
        "quantity": inv.quantity,
        "low_stock_threshold": inv.low_stock_threshold,
        "is_low_stock": inv.quantity <= inv.low_stock_threshold,
        "updated_at": inv.updated_at.isoformat(),
    }


@inventory_bp.get("")
@admin_required()
def list_inventory():
    page, per_page = get_pagination_params()
    query = Inventory.query.join(Product).filter(Product.is_active == True)

    if request.args.get("low_stock") == "true":
        query = query.filter(Inventory.quantity <= Inventory.low_stock_threshold)

    if request.args.get("q"):
        q = request.args["q"]
        query = query.filter(
            db.or_(Product.name.ilike(f"%{q}%"), Product.sku.ilike(f"%{q}%"))
        )

    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    return paginated_response([_inv_dict(i) for i in items], total, page, per_page)


@inventory_bp.post("/<int:product_id>/adjust")
@admin_required(allowed_roles=[AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.INVENTORY_STAFF])
def adjust_inventory(product_id):
    data = request.get_json(silent=True) or {}
    action_raw = (data.get("action") or "").strip()
    quantity = data.get("quantity")
    reason = (data.get("reason") or "").strip() or None

    if quantity is None or int(quantity) < 1:
        return error_response("VALIDATION_ERROR", "quantity must be a positive integer.")

    try:
        action = InventoryAction(action_raw)
    except ValueError:
        return error_response("VALIDATION_ERROR", f"Invalid action '{action_raw}'. Use: stock_in or stock_out.")

    quantity = int(quantity)
    admin_id = int(get_jwt_identity())

    inv = Inventory.query.filter_by(product_id=product_id).first()
    if not inv:
        # Auto-create inventory record if missing
        inv = Inventory(product_id=product_id, quantity=0)
        db.session.add(inv)
        db.session.flush()

    if action == InventoryAction.STOCK_OUT:
        if inv.quantity < quantity:
            return error_response("INSUFFICIENT_STOCK", "Cannot reduce below zero.", 422)
        inv.quantity -= quantity
        qty_change = -quantity
    else:  # stock_in or adjustment
        inv.quantity += quantity
        qty_change = quantity

    txn = InventoryTransaction(
        inventory_id=inv.id,
        action=action,
        quantity_change=qty_change,
        quantity_after=inv.quantity,
        reason=reason,
        performed_by_admin_id=admin_id,
    )
    db.session.add(txn)
    db.session.commit()
    return success_response(_inv_dict(inv))


@inventory_bp.patch("/<int:product_id>/set")
@admin_required(allowed_roles=[AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.INVENTORY_STAFF])
def set_inventory(product_id):
    """Directly set an absolute quantity (useful for correcting out-of-stock items)."""
    data = request.get_json(silent=True) or {}
    new_qty = data.get("quantity")
    reason = (data.get("reason") or "").strip() or None

    if new_qty is None or int(new_qty) < 0:
        return error_response("VALIDATION_ERROR", "quantity must be a non-negative integer.")

    new_qty = int(new_qty)
    admin_id = int(get_jwt_identity())

    inv = Inventory.query.filter_by(product_id=product_id).first()
    if not inv:
        # Auto-create inventory record if missing
        inv = Inventory(product_id=product_id, quantity=0)
        db.session.add(inv)
        db.session.flush()

    old_qty = inv.quantity
    qty_change = new_qty - old_qty
    inv.quantity = new_qty

    txn = InventoryTransaction(
        inventory_id=inv.id,
        action=InventoryAction.ADJUSTMENT,
        quantity_change=qty_change,
        quantity_after=new_qty,
        reason=reason or f"Direct stock set from {old_qty} to {new_qty}",
        performed_by_admin_id=admin_id,
    )
    db.session.add(txn)
    db.session.commit()
    return success_response(_inv_dict(inv))


@inventory_bp.get("/<int:product_id>/history")
@admin_required()
def inventory_history(product_id):
    inv = Inventory.query.filter_by(product_id=product_id).first()
    if not inv:
        return error_response("NOT_FOUND", "Inventory record not found.", 404)
    txns = (
        InventoryTransaction.query
        .filter_by(inventory_id=inv.id)
        .order_by(InventoryTransaction.created_at.desc())
        .limit(100)
        .all()
    )
    return success_response([
        {
            "id": t.id,
            "action": t.action.value,
            "quantity_change": t.quantity_change,
            "quantity_after": t.quantity_after,
            "reason": t.reason,
            "performed_by": t.performed_by.full_name if t.performed_by else None,
            "created_at": t.created_at.isoformat(),
        }
        for t in txns
    ])
