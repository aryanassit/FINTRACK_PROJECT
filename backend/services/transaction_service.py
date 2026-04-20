"""
Transaction service - all business logic lives here, keeping routes thin.
"""

from datetime import date
from backend.models.database import db
from backend.models.transaction import Transaction


VALID_TYPES       = {"income", "expense"}
VALID_CATEGORIES  = {
    "Salary", "Freelance", "Bonus", "Investment", "Other Income",
    "Food", "Rent", "Utilities", "Transport", "Shopping",
    "Entertainment", "Health", "Travel", "Education", "Other",
}


# ── Validation ────────────────────────────────────────────────────────────────

def validate_transaction_data(data: dict, require_all: bool = True) -> list[str]:
    """Return a list of error strings; empty list means valid."""
    errors = []

    if require_all or "amount" in data:
        try:
            val = float(data.get("amount", 0))
            if val <= 0:
                errors.append("amount must be a positive number")
        except (TypeError, ValueError):
            errors.append("amount must be a valid number")

    if require_all or "type" in data:
        if data.get("type") not in VALID_TYPES:
            errors.append(f"type must be one of: {', '.join(VALID_TYPES)}")

    if require_all or "category" in data:
        cat = data.get("category", "")
        if not cat:
            errors.append("category is required")

    if require_all or "date" in data:
        try:
            date.fromisoformat(data.get("date", ""))
        except (TypeError, ValueError):
            errors.append("date must be a valid ISO date (YYYY-MM-DD)")

    return errors


# ── CRUD ──────────────────────────────────────────────────────────────────────

def get_all_transactions(filters: dict = None) -> list[Transaction]:
    """Retrieve transactions with optional filters."""
    query = Transaction.query

    if filters:
        if filters.get("category"):
            query = query.filter(Transaction.category == filters["category"])
        if filters.get("type"):
            query = query.filter(Transaction.type == filters["type"])
        if filters.get("date_from"):
            query = query.filter(Transaction.date >= date.fromisoformat(filters["date_from"]))
        if filters.get("date_to"):
            query = query.filter(Transaction.date <= date.fromisoformat(filters["date_to"]))

    return query.order_by(Transaction.date.desc(), Transaction.id.desc()).all()


def create_transaction(data: dict) -> Transaction:
    txn = Transaction(
        amount=float(data["amount"]),
        type=data["type"],
        category=data["category"],
        date=date.fromisoformat(data["date"]),
        description=data.get("description", "").strip(),
    )
    db.session.add(txn)
    db.session.commit()
    return txn


def update_transaction(txn_id: int, data: dict) -> Transaction | None:
    txn = Transaction.query.get(txn_id)
    if not txn:
        return None

    if "amount"      in data: txn.amount      = float(data["amount"])
    if "type"        in data: txn.type        = data["type"]
    if "category"    in data: txn.category    = data["category"]
    if "date"        in data: txn.date        = date.fromisoformat(data["date"])
    if "description" in data: txn.description = data["description"].strip()

    db.session.commit()
    return txn


def delete_transaction(txn_id: int) -> bool:
    txn = Transaction.query.get(txn_id)
    if not txn:
        return False
    db.session.delete(txn)
    db.session.commit()
    return True
