"""
/api/reports  –  Monthly analytics endpoints
"""

from flask import Blueprint, request, jsonify
from datetime import date
from backend.services.analytics_service import get_monthly_report

reports_bp = Blueprint("reports", __name__)


@reports_bp.route("/reports/monthly", methods=["GET"])
def monthly_report():
    """
    GET /api/reports/monthly?year=2025&month=4
    Defaults to current year/month.
    """
    today = date.today()
    try:
        year  = int(request.args.get("year",  today.year))
        month = int(request.args.get("month", today.month))
        if not (1 <= month <= 12):
            raise ValueError
    except (TypeError, ValueError):
        return jsonify({"success": False, "error": "Invalid year or month"}), 400

    report = get_monthly_report(year, month)
    return jsonify({"success": True, "report": report}), 200
