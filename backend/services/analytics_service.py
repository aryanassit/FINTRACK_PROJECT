"""
Analytics service - computes monthly reports, category totals, and predictions.
"""

from collections import defaultdict
from datetime import date, timedelta
from backend.models.transaction import Transaction


def get_dashboard_summary() -> dict:
    """Overall totals for the dashboard cards."""
    all_txns = Transaction.query.all()
    income   = sum(t.amount for t in all_txns if t.type == "income")
    expenses = sum(t.amount for t in all_txns if t.type == "expense")
    return {
        "total_income":   round(income, 2),
        "total_expenses": round(expenses, 2),
        "balance":        round(income - expenses, 2),
        "total_transactions": len(all_txns),
    }


def get_monthly_trend(months: int = 6) -> dict:
    """
    Returns income/expense totals grouped by month for the last `months` months.
    Used for the line chart.
    """
    today    = date.today()
    results  = []

    for offset in range(months - 1, -1, -1):
        # First day of the target month
        target = date(today.year, today.month, 1) - timedelta(days=offset * 30)
        y, m   = target.year, target.month

        txns   = Transaction.query.filter(
            Transaction.date >= date(y, m, 1),
            Transaction.date <= _last_day(y, m),
        ).all()

        income   = sum(t.amount for t in txns if t.type == "income")
        expenses = sum(t.amount for t in txns if t.type == "expense")

        results.append({
            "label":    f"{_month_name(m)} {y}",
            "income":   round(income, 2),
            "expenses": round(expenses, 2),
            "savings":  round(income - expenses, 2),
        })

    return {"trend": results}


def get_category_breakdown() -> dict:
    """Expense totals by category for the pie chart."""
    txns    = Transaction.query.filter_by(type="expense").all()
    totals  = defaultdict(float)
    for t in txns:
        totals[t.category] += t.amount

    return {
        "categories": [
            {"category": k, "total": round(v, 2)}
            for k, v in sorted(totals.items(), key=lambda x: -x[1])
        ]
    }


def get_monthly_report(year: int, month: int) -> dict:
    """Full summary for a single month."""
    txns     = Transaction.query.filter(
        Transaction.date >= date(year, month, 1),
        Transaction.date <= _last_day(year, month),
    ).all()

    income   = sum(t.amount for t in txns if t.type == "income")
    expenses = sum(t.amount for t in txns if t.type == "expense")

    cat_totals = defaultdict(float)
    for t in txns:
        if t.type == "expense":
            cat_totals[t.category] += t.amount

    top_cat = max(cat_totals, key=cat_totals.get) if cat_totals else "N/A"

    return {
        "year":         year,
        "month":        month,
        "month_name":   _month_name(month),
        "income":       round(income, 2),
        "expenses":     round(expenses, 2),
        "savings":      round(income - expenses, 2),
        "savings_rate": round((income - expenses) / income * 100, 1) if income else 0,
        "top_category": top_cat,
        "top_category_amount": round(cat_totals.get(top_cat, 0), 2),
        "transaction_count": len(txns),
        "by_category": [
            {"category": k, "total": round(v, 2)}
            for k, v in sorted(cat_totals.items(), key=lambda x: -x[1])
        ],
    }


def get_expense_predictions(months_ahead: int = 1) -> dict:
    """
    Simple linear-regression-style prediction per category.
    Uses the last 3 months of data to estimate next month.
    """
    today   = date.today()
    window  = 3
    monthly = []

    for offset in range(window - 1, -1, -1):
        target = date(today.year, today.month, 1) - timedelta(days=offset * 30)
        y, m   = target.year, target.month

        txns   = Transaction.query.filter(
            Transaction.date >= date(y, m, 1),
            Transaction.date <= _last_day(y, m),
            Transaction.type == "expense",
        ).all()

        cat_totals = defaultdict(float)
        for t in txns:
            cat_totals[t.category] += t.amount
        monthly.append(cat_totals)

    # Collect all categories seen across the window
    all_cats = set()
    for m in monthly:
        all_cats.update(m.keys())

    predictions = []
    for cat in sorted(all_cats):
        vals   = [m.get(cat, 0) for m in monthly]
        avg    = sum(vals) / len(vals)
        # Weighted average: latest month counts more
        weighted = (vals[0] * 1 + vals[1] * 2 + vals[2] * 3) / 6 if len(vals) == 3 else avg
        # Linear trend: slope from first to last
        slope  = (vals[-1] - vals[0]) / max(len(vals) - 1, 1)
        predicted = max(0, weighted + slope * months_ahead)

        predictions.append({
            "category":      cat,
            "last_3_avg":    round(avg, 2),
            "predicted":     round(predicted, 2),
            "trend":         "up" if slope > 50 else "down" if slope < -50 else "stable",
            "history":       [round(v, 2) for v in vals],
        })

    predictions.sort(key=lambda x: -x["predicted"])

    return {
        "predictions":   predictions,
        "months_ahead":  months_ahead,
        "based_on_months": window,
    }


# ── Helpers ───────────────────────────────────────────────────────────────────

def _last_day(year: int, month: int) -> date:
    if month == 12:
        return date(year + 1, 1, 1) - timedelta(days=1)
    return date(year, month + 1, 1) - timedelta(days=1)


def _month_name(month: int) -> str:
    names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
             "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return names[month - 1]
