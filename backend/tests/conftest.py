"""
Pytest configuration and shared fixtures.
"""
import pytest
from werkzeug.security import generate_password_hash

from app import create_app, db as _db
from app.models import Admin, AdminRole, Customer


@pytest.fixture(scope="session")
def app():
    """Create a Flask test application."""
    application = create_app("testing")
    ctx = application.app_context()
    ctx.push()

    _db.create_all()
    yield application

    _db.session.remove()
    _db.drop_all()
    ctx.pop()


@pytest.fixture(scope="session")
def client(app):
    return app.test_client()


@pytest.fixture(scope="function", autouse=True)
def db_cleanup(app):
    """Roll back transactions after each test."""
    yield
    _db.session.rollback()


@pytest.fixture
def super_admin(app):
    admin = Admin(
        email="superadmin@test.com",
        username="superadmin",
        password_hash=generate_password_hash("TestPass123!"),
        full_name="Super Admin",
        role=AdminRole.SUPER_ADMIN,
    )
    _db.session.add(admin)
    _db.session.commit()
    yield admin
    _db.session.delete(admin)
    _db.session.commit()


@pytest.fixture
def admin_token(client, super_admin):
    resp = client.post(
        "/api/v1/admin/auth/login",
        json={"email": "superadmin@test.com", "password": "TestPass123!"},
    )
    return resp.get_json()["data"]["access_token"]


@pytest.fixture
def customer(app):
    c = Customer(
        email="customer@test.com",
        is_email_verified=True,
        full_name="Test Customer",
    )
    _db.session.add(c)
    _db.session.commit()
    yield c
    _db.session.delete(c)
    _db.session.commit()


@pytest.fixture
def customer_token(app, customer):
    from flask_jwt_extended import create_access_token
    with app.app_context():
        token = create_access_token(
            identity=str(customer.id),
            additional_claims={"type": "customer"},
        )
    return token
