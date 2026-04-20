"""
FinTrack - Personal Finance Tracker
Main application entry point
"""

from flask import Flask
from flask_cors import CORS
from backend.models.database import db
from backend.routes.transactions import transactions_bp
from backend.routes.reports import reports_bp
from backend.routes.exports import exports_bp
import os


def create_app():
    app = Flask(
        __name__,
        template_folder="frontend/templates",
        static_folder="frontend/static"
    )

    # ── Configuration ──────────────────────────────────────────────────────────
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    app.config["SQLALCHEMY_DATABASE_URI"] = (
        f"sqlite:///{os.path.join(BASE_DIR, 'fintrack.db')}"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-prod")

    # ── Extensions ─────────────────────────────────────────────────────────────
    CORS(app)
    db.init_app(app)

    # ── Blueprints ─────────────────────────────────────────────────────────────
    app.register_blueprint(transactions_bp, url_prefix="/api")
    app.register_blueprint(reports_bp, url_prefix="/api")
    app.register_blueprint(exports_bp, url_prefix="/api")

    # ── Serve frontend ─────────────────────────────────────────────────────────
    from flask import render_template

    @app.route("/")
    def index():
        return render_template("index.html")

    # ── Create tables ──────────────────────────────────────────────────────────
    with app.app_context():
        db.create_all()
        _seed_demo_data()

    return app


def _seed_demo_data():
    """Seed realistic demo data so the dashboard looks great on first run."""
    from backend.models.transaction import Transaction
    from backend.models.database import db
    from datetime import date, timedelta
    import random

    if Transaction.query.count() > 0:
        return  # already seeded

    today = date.today()
    sample = [
        # April
        ("Salary", 85000, "income", "Salary", today.replace(day=1)),
        ("Freelance Project", 12000, "income", "Freelance", today.replace(day=5)),
        ("Rent", 18000, "expense", "Rent", today.replace(day=2)),
        ("Electricity Bill", 1200, "expense", "Utilities", today.replace(day=3)),
        ("Swiggy", 420, "expense", "Food", today.replace(day=4)),
        ("Uber rides", 680, "expense", "Transport", today.replace(day=6)),
        ("Amazon order", 2300, "expense", "Shopping", today.replace(day=7)),
        ("Netflix + Spotify", 800, "expense", "Entertainment", today.replace(day=8)),
        ("Gym membership", 1500, "expense", "Health", today.replace(day=9)),
        ("Zomato", 350, "expense", "Food", today.replace(day=10)),
        # March
        ("Salary", 85000, "income", "Salary", today.replace(day=1) - timedelta(days=30)),
        ("Rent", 18000, "expense", "Rent", today.replace(day=2) - timedelta(days=30)),
        ("Electricity", 1050, "expense", "Utilities", today.replace(day=3) - timedelta(days=30)),
        ("Grocery store", 3200, "expense", "Food", today.replace(day=5) - timedelta(days=30)),
        ("Cab rides", 760, "expense", "Transport", today.replace(day=8) - timedelta(days=30)),
        ("Clothes shopping", 2400, "expense", "Shopping", today.replace(day=12) - timedelta(days=30)),
        ("Doctor visit", 800, "expense", "Health", today.replace(day=15) - timedelta(days=30)),
        # February
        ("Salary", 85000, "income", "Salary", today.replace(day=1) - timedelta(days=60)),
        ("Bonus", 10000, "income", "Bonus", today.replace(day=10) - timedelta(days=60)),
        ("Rent", 18000, "expense", "Rent", today.replace(day=2) - timedelta(days=60)),
        ("Food delivery", 2800, "expense", "Food", today.replace(day=6) - timedelta(days=60)),
        ("Flight ticket", 8500, "expense", "Travel", today.replace(day=14) - timedelta(days=60)),
        ("Metro card", 500, "expense", "Transport", today.replace(day=3) - timedelta(days=60)),
        ("OTT subscriptions", 900, "expense", "Entertainment", today.replace(day=5) - timedelta(days=60)),
        # January
        ("Salary", 82000, "income", "Salary", today.replace(day=1) - timedelta(days=90)),
        ("Rent", 18000, "expense", "Rent", today.replace(day=2) - timedelta(days=90)),
        ("Grocery", 2900, "expense", "Food", today.replace(day=7) - timedelta(days=90)),
        ("New Year shopping", 4500, "expense", "Shopping", today.replace(day=3) - timedelta(days=90)),
        ("Electricity", 1400, "expense", "Utilities", today.replace(day=4) - timedelta(days=90)),
        ("Gym", 1500, "expense", "Health", today.replace(day=5) - timedelta(days=90)),
    ]

    for desc, amount, txn_type, category, txn_date in sample:
        db.session.add(Transaction(
            description=desc,
            amount=amount,
            type=txn_type,
            category=category,
            date=txn_date
        ))
    db.session.commit()


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host="0.0.0.0", port=5000)
