"""
Export service - generates CSV and PDF files from transaction data.
"""

import csv
import io
from datetime import date
from backend.models.transaction import Transaction


def generate_csv(filters: dict = None) -> bytes:
    """
    Generate a UTF-8 encoded CSV of all (or filtered) transactions.
    Returns raw bytes ready to send as a file response.
    """
    from backend.services.transaction_service import get_all_transactions

    txns   = get_all_transactions(filters)
    output = io.StringIO()
    writer = csv.writer(output)

    # Header row
    writer.writerow(["ID", "Date", "Type", "Category", "Description", "Amount"])

    for t in txns:
        writer.writerow([t.id, t.date.isoformat(), t.type, t.category, t.description, t.amount])

    return output.getvalue().encode("utf-8")


def generate_pdf(filters: dict = None) -> bytes:
    """
    Generate a PDF report using reportlab.
    Returns raw PDF bytes.
    """
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from backend.services.transaction_service import get_all_transactions

    txns   = get_all_transactions(filters)
    income = sum(t.amount for t in txns if t.type == "income")
    expens = sum(t.amount for t in txns if t.type == "expense")

    buffer = io.BytesIO()
    doc    = SimpleDocTemplate(buffer, pagesize=A4,
                               rightMargin=2*cm, leftMargin=2*cm,
                               topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()
    story  = []

    # Title
    title_style = ParagraphStyle("title", parent=styles["Heading1"],
                                 textColor=colors.HexColor("#1a1a2e"),
                                 fontSize=20, spaceAfter=4)
    story.append(Paragraph("FinTrack — Transaction Report", title_style))
    story.append(Paragraph(f"Generated: {date.today().strftime('%B %d, %Y')}",
                           styles["Normal"]))
    story.append(Spacer(1, 0.5*cm))

    # Summary box
    summary_data = [
        ["Total Income", "Total Expenses", "Net Balance"],
        [f"₹{income:,.2f}", f"₹{expens:,.2f}", f"₹{income-expens:,.2f}"],
    ]
    summary_table = Table(summary_data, colWidths=[5.5*cm, 5.5*cm, 5.5*cm])
    summary_table.setStyle(TableStyle([
        ("BACKGROUND",  (0, 0), (-1, 0), colors.HexColor("#16213e")),
        ("TEXTCOLOR",   (0, 0), (-1, 0), colors.white),
        ("FONTNAME",    (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE",    (0, 0), (-1, 0), 10),
        ("ALIGN",       (0, 0), (-1, -1), "CENTER"),
        ("BACKGROUND",  (0, 1), (0, 1),  colors.HexColor("#d4edda")),
        ("BACKGROUND",  (1, 1), (1, 1),  colors.HexColor("#f8d7da")),
        ("BACKGROUND",  (2, 1), (2, 1),  colors.HexColor("#cce5ff")),
        ("FONTNAME",    (0, 1), (-1, 1), "Helvetica-Bold"),
        ("FONTSIZE",    (0, 1), (-1, 1), 12),
        ("GRID",        (0, 0), (-1, -1), 0.5, colors.grey),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [None, None]),
        ("TOPPADDING",  (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 0.7*cm))

    # Transactions table
    story.append(Paragraph("Transaction Details", styles["Heading2"]))
    story.append(Spacer(1, 0.2*cm))

    headers = ["Date", "Type", "Category", "Description", "Amount"]
    rows    = [headers] + [
        [t.date.strftime("%d %b %Y"),
         t.type.capitalize(),
         t.category,
         (t.description or "")[:35],
         f"₹{t.amount:,.2f}"]
        for t in txns
    ]

    col_widths = [2.5*cm, 2*cm, 3*cm, 6.5*cm, 3*cm]
    data_table = Table(rows, colWidths=col_widths)
    data_table.setStyle(TableStyle([
        ("BACKGROUND",   (0, 0), (-1, 0), colors.HexColor("#16213e")),
        ("TEXTCOLOR",    (0, 0), (-1, 0), colors.white),
        ("FONTNAME",     (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE",     (0, 0), (-1, 0), 9),
        ("ALIGN",        (4, 0), (4, -1), "RIGHT"),
        ("FONTSIZE",     (0, 1), (-1, -1), 8),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8f9fa")]),
        ("GRID",         (0, 0), (-1, -1), 0.3, colors.HexColor("#dee2e6")),
        ("TOPPADDING",   (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(data_table)

    doc.build(story)
    return buffer.getvalue()
