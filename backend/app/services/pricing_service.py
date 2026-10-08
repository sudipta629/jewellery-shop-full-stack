"""
Pricing service — single source of truth for price calculation.

The final product price is:
  metal_value = net_weight * rate_per_gram * (1 + wastage_percent/100)
  making      = metal_value * making_charge_percent/100
              + net_weight * making_charge_per_gram
  subtotal    = metal_value + making + stone_charge
  tax         = subtotal * tax_percent / 100
  total       = subtotal + tax

All arithmetic uses Python Decimal.
"""
from decimal import Decimal, ROUND_HALF_UP
from datetime import date

from app.models import Product, MetalRate


_ZERO = Decimal("0")
_TWO = Decimal("0.01")   # round to paise


def _latest_rate(metal: str, purity: str) -> Decimal:
    """
    Fetch the most recent metal rate for the given metal + purity.
    1. Try exact metal+purity match (case-insensitive)
    2. Fallback: any rate for that metal (most recent)
    Raises ValueError only if no rate at all for that metal.
    """
    metal_lower = metal.lower().strip()
    purity_clean = (purity or "").strip()

    # 1. Exact match (case-insensitive purity)
    rate = (
        MetalRate.query
        .filter(
            MetalRate.metal == metal_lower,
            MetalRate.purity.ilike(purity_clean)
        )
        .order_by(MetalRate.effective_date.desc(), MetalRate.id.desc())
        .first()
    )
    if rate:
        return Decimal(str(rate.rate_per_gram))

    # 2. Fallback — any rate for this metal (closest recent)
    fallback = (
        MetalRate.query
        .filter(MetalRate.metal == metal_lower)
        .order_by(MetalRate.effective_date.desc(), MetalRate.id.desc())
        .first()
    )
    if fallback:
        return Decimal(str(fallback.rate_per_gram))

    raise ValueError(
        f"No rate found for {metal} {purity}. "
        "Please add a rate in the admin panel (Rates section)."
    )


def compute_product_price(product: Product) -> dict:
    """
    Returns a dict with full price breakdown for the given product.
    Raises ValueError if any required rate is unavailable.
    """
    net_weight = Decimal(str(product.net_weight or _ZERO))
    gross_weight = Decimal(str(product.gross_weight or _ZERO))
    stone_charge = Decimal(str(product.stone_charge or _ZERO))
    making_pct = Decimal(str(product.making_charge_percent or _ZERO))
    making_per_gram = Decimal(str(product.making_charge_per_gram or _ZERO))
    wastage_pct = Decimal(str(product.wastage_percent or _ZERO))
    tax_pct = Decimal(str(product.tax_percent or _ZERO))

    # Get metal rate
    if product.purity and net_weight > _ZERO:
        rate_per_gram = _latest_rate(product.metal_type, product.purity)
        billable_weight = net_weight * (1 + wastage_pct / 100)
        metal_value = billable_weight * rate_per_gram
    else:
        rate_per_gram = _ZERO
        metal_value = _ZERO

    making_charge = (metal_value * making_pct / 100) + (net_weight * making_per_gram)
    subtotal = metal_value + making_charge + stone_charge
    tax_amount = subtotal * tax_pct / 100
    total = subtotal + tax_amount

    def r(v: Decimal) -> str:
        return str(v.quantize(_TWO, rounding=ROUND_HALF_UP))

    return {
        "metal_type": product.metal_type,
        "purity": product.purity,
        "net_weight": str(net_weight),
        "gross_weight": str(gross_weight),
        "rate_per_gram": r(rate_per_gram),
        "metal_value": r(metal_value),
        "making_charge": r(making_charge),
        "stone_charge": r(stone_charge),
        "subtotal": r(subtotal),
        "tax_percent": str(tax_pct),
        "tax_amount": r(tax_amount),
        "total": r(total),
        "currency": "INR",
    }


def compute_order_item_snapshot(product: Product, quantity: int) -> dict:
    """
    Compute a price snapshot for an order item.
    Returns a dict suitable for storing in order_items row.
    """
    price = compute_product_price(product)
    total = Decimal(price["total"])
    line_total = (total * quantity).quantize(_TWO, rounding=ROUND_HALF_UP)

    return {
        "product_name": product.name,
        "product_sku": product.sku,
        "metal_type": product.metal_type,
        "purity": product.purity,
        "net_weight": price["net_weight"],
        "rate_per_gram": price["rate_per_gram"],
        "making_charge": price["making_charge"],
        "stone_charge": price["stone_charge"],
        "tax_amount": price["tax_amount"],
        "unit_price": price["total"],
        "line_total": str(line_total),
        "quantity": quantity,
    }
