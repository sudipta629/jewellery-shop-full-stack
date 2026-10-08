"""
All SQLAlchemy models for the jewellery platform.

Models are organised in sections:
  - Enumerations
  - Admin / Auth
  - Customer / Auth
  - Catalogue
  - Pricing / Rates
  - Cart & Wishlist
  - Orders
  - Inventory
  - Payments
  - Marketing (Coupons, Offers, Banners)
  - Misc (Contact, Notifications, Appointments, KYC)
"""

import enum
from datetime import datetime, timezone
from decimal import Decimal

from app import db  # noqa: E402 — imported after factory initialisation


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _now():
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Enumerations
# ---------------------------------------------------------------------------

class AdminRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    SALES_STAFF = "sales_staff"
    INVENTORY_STAFF = "inventory_staff"


class OtpPurpose(str, enum.Enum):
    LOGIN = "login"
    REGISTER = "register"
    EMAIL_VERIFY = "email_verify"


class OtpChannel(str, enum.Enum):
    EMAIL = "email"
    PHONE = "phone"


class OrderStatus(str, enum.Enum):
    PLACED = "placed"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    HALLMARKING = "hallmarking"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    REFUNDED = "refunded"


class PaymentMethod(str, enum.Enum):
    COD = "cod"
    ONLINE = "online"


class InventoryAction(str, enum.Enum):
    STOCK_IN = "stock_in"
    STOCK_OUT = "stock_out"
    ADJUSTMENT = "adjustment"
    SALE = "sale"
    RETURN = "return"


class AppointmentStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class KYCStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class ContactStatus(str, enum.Enum):
    NEW = "new"
    READ = "read"
    RESOLVED = "resolved"


class NotificationType(str, enum.Enum):
    ORDER = "order"
    PAYMENT = "payment"
    PROMOTIONAL = "promotional"
    ACCOUNT = "account"


# ---------------------------------------------------------------------------
# Admin models
# ---------------------------------------------------------------------------

class Admin(db.Model):
    __tablename__ = "admins"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum(AdminRole), nullable=False, default=AdminRole.ADMIN)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    last_login_at = db.Column(db.DateTime(timezone=True))
    created_at = db.Column(db.DateTime(timezone=True), default=_now, nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)

    def __repr__(self):
        return f"<Admin {self.email} [{self.role.value}]>"


# ---------------------------------------------------------------------------
# Customer models
# ---------------------------------------------------------------------------

class Customer(db.Model):
    __tablename__ = "customers"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=True, index=True)
    phone = db.Column(db.String(20), unique=True, nullable=True, index=True)
    full_name = db.Column(db.String(255), nullable=True)
    is_email_verified = db.Column(db.Boolean, default=False, nullable=False)
    is_phone_verified = db.Column(db.Boolean, default=False, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    last_login_at = db.Column(db.DateTime(timezone=True))
    created_at = db.Column(db.DateTime(timezone=True), default=_now, nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)

    # Relationships
    addresses = db.relationship("Address", back_populates="customer", lazy="dynamic")
    cart = db.relationship("Cart", back_populates="customer", uselist=False)
    wishlist_items = db.relationship("WishlistItem", back_populates="customer", lazy="dynamic")
    orders = db.relationship("Order", back_populates="customer", lazy="dynamic")
    notifications = db.relationship("Notification", back_populates="customer", lazy="dynamic")
    kyc = db.relationship("KYC", back_populates="customer", uselist=False)
    appointments = db.relationship("Appointment", back_populates="customer", lazy="dynamic")

    def __repr__(self):
        return f"<Customer {self.email or self.phone}>"


class Address(db.Model):
    __tablename__ = "addresses"

    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    label = db.Column(db.String(50), nullable=False, default="Home")
    full_name = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    line1 = db.Column(db.String(255), nullable=False)
    line2 = db.Column(db.String(255))
    city = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(100), nullable=False)
    pincode = db.Column(db.String(20), nullable=False)
    country = db.Column(db.String(100), nullable=False, default="India")
    is_default = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=_now, nullable=False)

    customer = db.relationship("Customer", back_populates="addresses")


class OTP(db.Model):
    __tablename__ = "otps"

    id = db.Column(db.Integer, primary_key=True)
    contact = db.Column(db.String(255), nullable=False, index=True)
    channel = db.Column(db.Enum(OtpChannel), nullable=False)
    purpose = db.Column(db.Enum(OtpPurpose), nullable=False)
    code_hash = db.Column(db.String(255), nullable=False)
    attempts = db.Column(db.Integer, default=0, nullable=False)
    is_used = db.Column(db.Boolean, default=False, nullable=False)
    expires_at = db.Column(db.DateTime(timezone=True), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=_now, nullable=False)

    __table_args__ = (
        db.Index("ix_otps_contact_purpose", "contact", "purpose"),
    )


# ---------------------------------------------------------------------------
# Catalogue models
# ---------------------------------------------------------------------------

class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    slug = db.Column(db.String(120), unique=True, nullable=False, index=True)
    description = db.Column(db.Text)
    image_url = db.Column(db.String(500))
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    sort_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime(timezone=True), default=_now, nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)

    products = db.relationship("Product", back_populates="category", lazy="dynamic")

    def __repr__(self):
        return f"<Category {self.name}>"


class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)
    sku = db.Column(db.String(50), unique=True, nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False, index=True)

    # Metal attributes
    metal_type = db.Column(db.String(50), nullable=False)  # e.g. Gold, Silver, Platinum, Diamond
    purity = db.Column(db.String(20))                       # e.g. 22K, 18K, 925
    gross_weight = db.Column(db.Numeric(10, 3))             # grams
    net_weight = db.Column(db.Numeric(10, 3))               # grams (metal weight only)

    # Charges (stored as Decimal; backend recalculates final price)
    making_charge_per_gram = db.Column(db.Numeric(12, 2), default=Decimal("0"))
    making_charge_percent = db.Column(db.Numeric(5, 2), default=Decimal("0"))
    stone_charge = db.Column(db.Numeric(12, 2), default=Decimal("0"))
    wastage_percent = db.Column(db.Numeric(5, 2), default=Decimal("0"))

    # Tax
    tax_percent = db.Column(db.Numeric(5, 2), default=Decimal("3"))  # GST

    # Flags
    is_featured = db.Column(db.Boolean, default=False)
    is_new_arrival = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    gender = db.Column(db.String(20))           # men, women, unisex
    occasion = db.Column(db.String(50))         # bridal, daily, festive

    # Metadata
    care_info = db.Column(db.Text)
    created_at = db.Column(db.DateTime(timezone=True), default=_now, nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)

    # Relationships
    category = db.relationship("Category", back_populates="products")
    images = db.relationship("ProductImage", back_populates="product", order_by="ProductImage.sort_order", cascade="all, delete-orphan")
    inventory = db.relationship("Inventory", back_populates="product", uselist=False)
    cart_items = db.relationship("CartItem", back_populates="product")
    order_items = db.relationship("OrderItem", back_populates="product")

    def __repr__(self):
        return f"<Product {self.sku} — {self.name}>"


class ProductImage(db.Model):
    __tablename__ = "product_images"

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    url = db.Column(db.String(500), nullable=False)
    alt_text = db.Column(db.String(255))
    is_primary = db.Column(db.Boolean, default=False, nullable=False)
    sort_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime(timezone=True), default=_now, nullable=False)

    product = db.relationship("Product", back_populates="images")


# ---------------------------------------------------------------------------
# Pricing / Rates
# ---------------------------------------------------------------------------

class MetalRate(db.Model):
    """Stores the current and historical gold/silver rates."""
    __tablename__ = "metal_rates"

    id = db.Column(db.Integer, primary_key=True)
    metal = db.Column(db.String(20), nullable=False)    # gold, silver, platinum
    purity = db.Column(db.String(20), nullable=False)   # 24K, 22K, 18K, 999
    rate_per_gram = db.Column(db.Numeric(12, 2), nullable=False)
    effective_date = db.Column(db.Date, nullable=False)
    updated_by_admin_id = db.Column(db.Integer, db.ForeignKey("admins.id", ondelete="SET NULL"))
    created_at = db.Column(db.DateTime(timezone=True), default=_now, nullable=False)

    updated_by = db.relationship("Admin")

    __table_args__ = (
        db.Index("ix_metal_rates_metal_purity_date", "metal", "purity", "effective_date"),
    )

    def __repr__(self):
        return f"<MetalRate {self.metal} {self.purity} @ ₹{self.rate_per_gram}/g>"


# ---------------------------------------------------------------------------
# Cart
# ---------------------------------------------------------------------------

class Cart(db.Model):
    __tablename__ = "carts"

    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("customers.id", ondelete="CASCADE"), unique=True, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=_now, nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)

    customer = db.relationship("Customer", back_populates="cart")
    items = db.relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")


class CartItem(db.Model):
    __tablename__ = "cart_items"

    id = db.Column(db.Integer, primary_key=True)
    cart_id = db.Column(db.Integer, db.ForeignKey("carts.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    added_at = db.Column(db.DateTime(timezone=True), default=_now, nullable=False)

    cart = db.relationship("Cart", back_populates="items")
    product = db.relationship("Product", back_populates="cart_items")

    __table_args__ = (
        db.UniqueConstraint("cart_id", "product_id", name="uq_cart_items_cart_product"),
    )


# ---------------------------------------------------------------------------
# Wishlist
# ---------------------------------------------------------------------------

class WishlistItem(db.Model):
    __tablename__ = "wishlist_items"

    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    added_at = db.Column(db.DateTime(timezone=True), default=_now, nullable=False)

    customer = db.relationship("Customer", back_populates="wishlist_items")
    product = db.relationship("Product")

    __table_args__ = (
        db.UniqueConstraint("customer_id", "product_id", name="uq_wishlist_items_customer_product"),
    )


# ---------------------------------------------------------------------------
# Orders
# ---------------------------------------------------------------------------

class Order(db.Model):
    __tablename__ = "orders"

    id = db.Column(db.Integer, primary_key=True)
    order_number = db.Column(db.String(30), unique=True, nullable=False, index=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False, index=True)

    # Snapshot of delivery address (denormalised so address changes don't affect history)
    address_snapshot = db.Column(db.JSON, nullable=False)

    # Price snapshot (backend computed at order time)
    subtotal = db.Column(db.Numeric(14, 2), nullable=False)
    discount_amount = db.Column(db.Numeric(14, 2), default=Decimal("0"))
    coupon_code = db.Column(db.String(50))
    shipping_charge = db.Column(db.Numeric(10, 2), default=Decimal("0"))
    tax_amount = db.Column(db.Numeric(12, 2), default=Decimal("0"))
    total_amount = db.Column(db.Numeric(14, 2), nullable=False)

    status = db.Column(db.Enum(OrderStatus), default=OrderStatus.PLACED, nullable=False, index=True)
    payment_method = db.Column(db.Enum(PaymentMethod), nullable=False)
    payment_status = db.Column(db.Enum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)

    notes = db.Column(db.Text)
    placed_at = db.Column(db.DateTime(timezone=True), default=_now, nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)

    customer = db.relationship("Customer", back_populates="orders")
    items = db.relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    status_history = db.relationship("OrderStatusHistory", back_populates="order", order_by="OrderStatusHistory.created_at")
    payment = db.relationship("Payment", back_populates="order", uselist=False)
    invoice = db.relationship("Invoice", back_populates="order", uselist=False)

    def __repr__(self):
        return f"<Order {self.order_number}>"


class OrderItem(db.Model):
    __tablename__ = "order_items"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id", ondelete="RESTRICT"), nullable=False, index=True)
    quantity = db.Column(db.Integer, nullable=False)

    # Price snapshot at order time — never changes after placed
    product_name = db.Column(db.String(255), nullable=False)
    product_sku = db.Column(db.String(50), nullable=False)
    metal_type = db.Column(db.String(50))
    purity = db.Column(db.String(20))
    net_weight = db.Column(db.Numeric(10, 3))
    rate_per_gram = db.Column(db.Numeric(12, 2))
    making_charge = db.Column(db.Numeric(12, 2), default=Decimal("0"))
    stone_charge = db.Column(db.Numeric(12, 2), default=Decimal("0"))
    tax_amount = db.Column(db.Numeric(12, 2), default=Decimal("0"))
    unit_price = db.Column(db.Numeric(12, 2), nullable=False)   # final price per unit incl. tax
    line_total = db.Column(db.Numeric(14, 2), nullable=False)

    order = db.relationship("Order", back_populates="items")
    product = db.relationship("Product", back_populates="order_items")


class OrderStatusHistory(db.Model):
    __tablename__ = "order_status_history"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    status = db.Column(db.Enum(OrderStatus), nullable=False)
    note = db.Column(db.Text)
    changed_by_admin_id = db.Column(db.Integer, db.ForeignKey("admins.id", ondelete="SET NULL"))
    created_at = db.Column(db.DateTime(timezone=True), default=_now, nullable=False)

    order = db.relationship("Order", back_populates="status_history")
    changed_by = db.relationship("Admin")


# ---------------------------------------------------------------------------
# Inventory
# ---------------------------------------------------------------------------

class Inventory(db.Model):
    __tablename__ = "inventory"

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id", ondelete="CASCADE"), unique=True, nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=0)
    low_stock_threshold = db.Column(db.Integer, default=5)
    updated_at = db.Column(db.DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)

    product = db.relationship("Product", back_populates="inventory")
    transactions = db.relationship("InventoryTransaction", back_populates="inventory_record", order_by="InventoryTransaction.created_at.desc()")


class InventoryTransaction(db.Model):
    __tablename__ = "inventory_transactions"

    id = db.Column(db.Integer, primary_key=True)
    inventory_id = db.Column(db.Integer, db.ForeignKey("inventory.id", ondelete="CASCADE"), nullable=False, index=True)
    action = db.Column(db.Enum(InventoryAction), nullable=False)
    quantity_change = db.Column(db.Integer, nullable=False)  # positive = in, negative = out
    quantity_after = db.Column(db.Integer, nullable=False)
    reason = db.Column(db.Text)
    reference_order_id = db.Column(db.Integer, db.ForeignKey("orders.id", ondelete="SET NULL"))
    performed_by_admin_id = db.Column(db.Integer, db.ForeignKey("admins.id", ondelete="SET NULL"))
    created_at = db.Column(db.DateTime(timezone=True), default=_now, nullable=False)

    inventory_record = db.relationship("Inventory", back_populates="transactions")
    performed_by = db.relationship("Admin")


# ---------------------------------------------------------------------------
# Payments
# ---------------------------------------------------------------------------

class Payment(db.Model):
    __tablename__ = "payments"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id", ondelete="RESTRICT"), unique=True, nullable=False)
    method = db.Column(db.Enum(PaymentMethod), nullable=False)
    status = db.Column(db.Enum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False, index=True)
    amount = db.Column(db.Numeric(14, 2), nullable=False)
    currency = db.Column(db.String(10), default="INR")
    provider = db.Column(db.String(50))          # razorpay, stripe, cod, etc.
    provider_payment_id = db.Column(db.String(200), unique=True)
    provider_order_id = db.Column(db.String(200))
    provider_signature = db.Column(db.String(500))
    webhook_payload = db.Column(db.JSON)
    paid_at = db.Column(db.DateTime(timezone=True))
    created_at = db.Column(db.DateTime(timezone=True), default=_now, nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)

    order = db.relationship("Order", back_populates="payment")


# ---------------------------------------------------------------------------
# Coupons
# ---------------------------------------------------------------------------

class Coupon(db.Model):
    __tablename__ = "coupons"

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    description = db.Column(db.Text)
    discount_type = db.Column(db.String(20), nullable=False)   # percentage | fixed
    discount_value = db.Column(db.Numeric(12, 2), nullable=False)
    max_discount = db.Column(db.Numeric(12, 2))                # cap for percentage discount
    min_order_amount = db.Column(db.Numeric(12, 2), default=Decimal("0"))
    usage_limit = db.Column(db.Integer)                        # None = unlimited
    usage_count = db.Column(db.Integer, default=0, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    valid_from = db.Column(db.DateTime(timezone=True))
    valid_until = db.Column(db.DateTime(timezone=True))
    created_by_admin_id = db.Column(db.Integer, db.ForeignKey("admins.id", ondelete="SET NULL"))
    created_at = db.Column(db.DateTime(timezone=True), default=_now, nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)

    usages = db.relationship("CouponUsage", back_populates="coupon")
    created_by = db.relationship("Admin")


class CouponUsage(db.Model):
    __tablename__ = "coupon_usage"

    id = db.Column(db.Integer, primary_key=True)
    coupon_id = db.Column(db.Integer, db.ForeignKey("coupons.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    discount_applied = db.Column(db.Numeric(12, 2), nullable=False)
    used_at = db.Column(db.DateTime(timezone=True), default=_now, nullable=False)

    coupon = db.relationship("Coupon", back_populates="usages")

    __table_args__ = (
        db.UniqueConstraint("coupon_id", "order_id", name="uq_coupon_usage_coupon_order"),
    )


# ---------------------------------------------------------------------------
# Offers
# ---------------------------------------------------------------------------

class Offer(db.Model):
    __tablename__ = "offers"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    discount_type = db.Column(db.String(20), nullable=False)  # percentage | fixed
    discount_value = db.Column(db.Numeric(12, 2), nullable=False)
    applies_to = db.Column(db.String(20), default="all")      # all | category | product
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id", ondelete="SET NULL"))
    product_id = db.Column(db.Integer, db.ForeignKey("products.id", ondelete="SET NULL"))
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    starts_at = db.Column(db.DateTime(timezone=True))
    ends_at = db.Column(db.DateTime(timezone=True))
    created_by_admin_id = db.Column(db.Integer, db.ForeignKey("admins.id", ondelete="SET NULL"))
    created_at = db.Column(db.DateTime(timezone=True), default=_now, nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)

    category = db.relationship("Category")
    product_ref = db.relationship("Product")
    created_by = db.relationship("Admin")


# ---------------------------------------------------------------------------
# Banners
# ---------------------------------------------------------------------------

class Banner(db.Model):
    __tablename__ = "banners"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    subtitle = db.Column(db.String(500))
    cta_text = db.Column(db.String(100))
    cta_url = db.Column(db.String(500))
    image_url = db.Column(db.String(500), nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    sort_order = db.Column(db.Integer, default=0)
    starts_at = db.Column(db.DateTime(timezone=True))
    ends_at = db.Column(db.DateTime(timezone=True))
    created_by_admin_id = db.Column(db.Integer, db.ForeignKey("admins.id", ondelete="SET NULL"))
    created_at = db.Column(db.DateTime(timezone=True), default=_now, nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)

    created_by = db.relationship("Admin")


# ---------------------------------------------------------------------------
# Invoice
# ---------------------------------------------------------------------------

class Invoice(db.Model):
    __tablename__ = "invoices"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id", ondelete="RESTRICT"), unique=True, nullable=False)
    invoice_number = db.Column(db.String(50), unique=True, nullable=False)
    pdf_url = db.Column(db.String(500))
    issued_at = db.Column(db.DateTime(timezone=True), default=_now, nullable=False)

    order = db.relationship("Order", back_populates="invoice")


# ---------------------------------------------------------------------------
# Purity Certificate
# ---------------------------------------------------------------------------

class PurityCertificate(db.Model):
    __tablename__ = "purity_certificates"

    id = db.Column(db.Integer, primary_key=True)
    order_item_id = db.Column(db.Integer, db.ForeignKey("order_items.id", ondelete="RESTRICT"), nullable=False)
    certificate_number = db.Column(db.String(100), unique=True, nullable=False)
    hallmark_number = db.Column(db.String(100))
    issued_by = db.Column(db.String(255))
    issued_date = db.Column(db.Date)
    pdf_url = db.Column(db.String(500))
    created_at = db.Column(db.DateTime(timezone=True), default=_now, nullable=False)

    order_item = db.relationship("OrderItem")


# ---------------------------------------------------------------------------
# Notifications
# ---------------------------------------------------------------------------

class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    notification_type = db.Column(db.Enum(NotificationType), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    reference_id = db.Column(db.Integer)   # e.g. order_id
    reference_type = db.Column(db.String(50))
    created_at = db.Column(db.DateTime(timezone=True), default=_now, nullable=False)

    customer = db.relationship("Customer", back_populates="notifications")


# ---------------------------------------------------------------------------
# Contact Messages
# ---------------------------------------------------------------------------

class ContactMessage(db.Model):
    __tablename__ = "contact_messages"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(20))
    message = db.Column(db.Text, nullable=False)
    status = db.Column(db.Enum(ContactStatus), default=ContactStatus.NEW, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=_now, nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)


# ---------------------------------------------------------------------------
# Appointments
# ---------------------------------------------------------------------------

class Appointment(db.Model):
    __tablename__ = "appointments"

    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    appointment_date = db.Column(db.Date, nullable=False)
    appointment_time = db.Column(db.Time, nullable=False)
    purpose = db.Column(db.String(255))
    notes = db.Column(db.Text)
    status = db.Column(db.Enum(AppointmentStatus), default=AppointmentStatus.PENDING, nullable=False)
    admin_notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime(timezone=True), default=_now, nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)

    customer = db.relationship("Customer", back_populates="appointments")


# ---------------------------------------------------------------------------
# KYC
# ---------------------------------------------------------------------------

class KYC(db.Model):
    __tablename__ = "kyc"

    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("customers.id", ondelete="CASCADE"), unique=True, nullable=False)
    document_type = db.Column(db.String(50))  # aadhaar, pan, passport
    document_number = db.Column(db.String(50))
    document_front_url = db.Column(db.String(500))
    document_back_url = db.Column(db.String(500))
    status = db.Column(db.Enum(KYCStatus), default=KYCStatus.PENDING, nullable=False, index=True)
    reviewed_by_admin_id = db.Column(db.Integer, db.ForeignKey("admins.id", ondelete="SET NULL"))
    review_notes = db.Column(db.Text)
    submitted_at = db.Column(db.DateTime(timezone=True), default=_now, nullable=False)
    reviewed_at = db.Column(db.DateTime(timezone=True))

    customer = db.relationship("Customer", back_populates="kyc")
    reviewed_by = db.relationship("Admin")
