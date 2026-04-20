"""
/api/export  –  CSV and PDF download endpoints
"""

from flask import Blueprint, request, Response
from backend.services.export_service import generate_csv, generate_pdf

exports_bp = Blueprint("exports", __name__)


def _get_filters():
    return {k: request.args.get(k) for k in ("category", "type", "date_from", "date_to")
            if request.args.get(k)}


@exports_bp.route("/export/csv", methods=["GET"])
def export_csv():
    csv_bytes = generate_csv(_get_filters())
    return Response(
        csv_bytes,
        status=200,
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=fintrack_export.csv"},
    )


@exports_bp.route("/export/pdf", methods=["GET"])
def export_pdf():
    pdf_bytes = generate_pdf(_get_filters())
    return Response(
        pdf_bytes,
        status=200,
        mimetype="application/pdf",
        headers={"Content-Disposition": "attachment; filename=fintrack_report.pdf"},
    )
