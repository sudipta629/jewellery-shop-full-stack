"""
API v1 blueprint — registers all sub-blueprints.
"""
from flask import Blueprint

api_v1_blueprint = Blueprint("api_v1", __name__)

# Import and register sub-blueprints
from app.api.v1.auth import auth_bp
from app.api.v1.admin_auth import admin_auth_bp
from app.api.v1.customers import customers_bp
from app.api.v1.categories import categories_bp
from app.api.v1.products import products_bp
from app.api.v1.rates import rates_bp
from app.api.v1.cart import cart_bp
from app.api.v1.wishlist import wishlist_bp
from app.api.v1.orders import orders_bp
from app.api.v1.inventory import inventory_bp
from app.api.v1.payments import payments_bp
from app.api.v1.coupons import coupons_bp
from app.api.v1.offers import offers_bp
from app.api.v1.banners import banners_bp
from app.api.v1.contact import contact_bp
from app.api.v1.admin import admin_bp
from app.api.v1.uploads import uploads_bp
from app.api.v1.notifications import notifications_bp
from app.api.v1.appointments import appointments_bp
from app.api.v1.kyc import kyc_bp

api_v1_blueprint.register_blueprint(auth_bp, url_prefix="/auth")
api_v1_blueprint.register_blueprint(admin_auth_bp, url_prefix="/admin/auth")
api_v1_blueprint.register_blueprint(customers_bp, url_prefix="/customers")
api_v1_blueprint.register_blueprint(categories_bp, url_prefix="/categories")
api_v1_blueprint.register_blueprint(products_bp, url_prefix="/products")
api_v1_blueprint.register_blueprint(rates_bp, url_prefix="/rates")
api_v1_blueprint.register_blueprint(cart_bp, url_prefix="/cart")
api_v1_blueprint.register_blueprint(wishlist_bp, url_prefix="/wishlist")
api_v1_blueprint.register_blueprint(orders_bp, url_prefix="/orders")
api_v1_blueprint.register_blueprint(inventory_bp, url_prefix="/inventory")
api_v1_blueprint.register_blueprint(payments_bp, url_prefix="/payments")
api_v1_blueprint.register_blueprint(coupons_bp, url_prefix="/coupons")
api_v1_blueprint.register_blueprint(offers_bp, url_prefix="/offers")
api_v1_blueprint.register_blueprint(banners_bp, url_prefix="/banners")
api_v1_blueprint.register_blueprint(contact_bp, url_prefix="/contact")
api_v1_blueprint.register_blueprint(admin_bp, url_prefix="/admin")
api_v1_blueprint.register_blueprint(uploads_bp, url_prefix="/uploads")
api_v1_blueprint.register_blueprint(notifications_bp, url_prefix="/notifications")
api_v1_blueprint.register_blueprint(appointments_bp, url_prefix="/appointments")
api_v1_blueprint.register_blueprint(kyc_bp, url_prefix="/kyc")
