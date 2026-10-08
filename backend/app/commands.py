"""
Flask CLI commands.

Usage:
    flask seed-admin      — create initial super admin
    flask seed-categories — seed default categories
    flask seed-rates      — seed sample metal rates
"""
import click
from flask import current_app
from flask.cli import with_appcontext
from werkzeug.security import generate_password_hash
from datetime import date
from decimal import Decimal

from app import db
from app.models import Admin, AdminRole, Category, MetalRate


def register_commands(app):
    app.cli.add_command(seed_admin)
    app.cli.add_command(seed_categories)
    app.cli.add_command(seed_rates)


@click.command("seed-admin")
@with_appcontext
def seed_admin():
    """Create initial super admin account. Configure via env vars ADMIN_EMAIL and ADMIN_PASSWORD."""
    import os
    email = os.environ.get("ADMIN_EMAIL", "admin@jewellery.com")
    password = os.environ.get("ADMIN_PASSWORD", "ChangeMe123!")

    if Admin.query.filter_by(email=email).first():
        click.echo(f"Admin '{email}' already exists.")
        return

    admin = Admin(
        email=email,
        username="superadmin",
        password_hash=generate_password_hash(password),
        full_name="Super Admin",
        role=AdminRole.SUPER_ADMIN,
    )
    db.session.add(admin)
    db.session.commit()
    click.echo(f"Super admin created: {email}")
    click.echo("IMPORTANT: Change the admin password immediately after first login.")


@click.command("seed-categories")
@with_appcontext
def seed_categories():
    """Seed default jewellery categories."""
    categories = [
        ("Necklaces", "necklaces"),
        ("Earrings", "earrings"),
        ("Rings", "rings"),
        ("Bangles", "bangles"),
        ("Bracelets", "bracelets"),
        ("Bridal", "bridal"),
        ("Mangalsutra", "mangalsutra"),
        ("Pendants", "pendants"),
        ("Chains", "chains"),
        ("Anklets", "anklets"),
        ("Men's Jewellery", "mens-jewellery"),
        ("Kids Jewellery", "kids-jewellery"),
    ]
    created = 0
    for name, slug in categories:
        if not Category.query.filter_by(slug=slug).first():
            cat = Category(name=name, slug=slug, is_active=True)
            db.session.add(cat)
            created += 1
    db.session.commit()
    click.echo(f"Seeded {created} categories.")


@click.command("seed-rates")
@with_appcontext
def seed_rates():
    """Seed sample gold/silver rates for development."""
    today = date.today()
    rates = [
        ("gold", "24K", Decimal("7200")),
        ("gold", "22K", Decimal("6600")),
        ("gold", "18K", Decimal("5400")),
        ("silver", "999", Decimal("85")),
    ]
    admin = Admin.query.first()
    for metal, purity, rate in rates:
        existing = MetalRate.query.filter_by(metal=metal, purity=purity, effective_date=today).first()
        if not existing:
            r = MetalRate(
                metal=metal,
                purity=purity,
                rate_per_gram=rate,
                effective_date=today,
                updated_by_admin_id=admin.id if admin else None,
            )
            db.session.add(r)
    db.session.commit()
    click.echo("Sample rates seeded.")
