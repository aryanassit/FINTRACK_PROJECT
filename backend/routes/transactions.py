"""
/api/transactions  –  CRUD endpoints
"""

from flask import Blueprint, request, jsonify
from backend.services import transaction_service as svc
from backend.services.analytics_service import (
    get_dashboard_summary, get_monthly_trend,
    get_category_breakdown, get_expense_predictions,
)

transactions_bp = Blueprint("transactions", __name__)


# ── Helper ────────────────────────────────────────────────────────────────────

def _ok(data, code=200):
    return jsonify({"success": True, **data}), code


def _err(msg, code=400):
    return jsonify({"success": False, "error": msg}), code


# ── CRUD ──────────────────────────────────────────────────────────────────────

@transactions_bp.route("/transactions", methods=["GET"])
def get_transactions():
    """GET /api/transactions?category=&type=&date_from=&date_to="""
    filters = {k: request.args.get(k) for k in ("category", "type", "date_from", "date_to")}
    filters = {k: v for k, v in filters.items() if v}   # drop empty
    txns = svc.get_all_transactions(filters)
    return _ok({"transactions": [t.to_dict() for t in txns],
                "count": len(txns)})


@transactions_bp.route("/add-transaction", methods=["POST"])
def add_transaction():
    """POST /api/add-transaction  body: JSON"""
    data = request.get_json(silent=True) or {}
    errors = svc.validate_transaction_data(data, require_all=True)
    if errors:
        return _err("; ".join(errors))

    txn = svc.create_transaction(data)
    return _ok({"transaction": txn.to_dict(), "message": "Transaction added"}, 201)


@transactions_bp.route("/update-transaction/<int:txn_id>", methods=["PUT"])
def update_transaction(txn_id):
    """PUT /api/update-transaction/<id>  body: JSON (partial OK)"""
    data = request.get_json(silent=True) or {}
    errors = svc.validate_transaction_data(data, require_all=False)
    if errors:
        return _err("; ".join(errors))

    txn = svc.update_transaction(txn_id, data)
    if not txn:
        return _err("Transaction not found", 404)
    return _ok({"transaction": txn.to_dict(), "message": "Transaction updated"})


@transactions_bp.route("/delete-transaction/<int:txn_id>", methods=["DELETE"])
def delete_transaction(txn_id):
    """DELETE /api/delete-transaction/<id>"""
    ok = svc.delete_transaction(txn_id)
    if not ok:
        return _err("Transaction not found", 404)
    return _ok({"message": "Transaction deleted"})


# ── Analytics ─────────────────────────────────────────────────────────────────

@transactions_bp.route("/dashboard", methods=["GET"])
def dashboard():
    return _ok({
        "summary":    get_dashboard_summary(),
        "trend":      get_monthly_trend(6),
        "categories": get_category_breakdown(),
    })


@transactions_bp.route("/predictions", methods=["GET"])
def predictions():
    months = int(request.args.get("months", 1))
    return _ok(get_expense_predictions(months))
