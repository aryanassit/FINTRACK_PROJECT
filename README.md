# 💰 FinTrack — Personal Finance Tracker

A production-ready full-stack finance tracker built with **Flask + SQLite + Vanilla JS**.

---

## 📁 Project Structure

```
fintrack/
├── app.py                          # Flask app factory & entry point
├── requirements.txt
├── fintrack.db                     # SQLite DB (auto-created on first run)
│
├── backend/
│   ├── models/
│   │   ├── database.py             # SQLAlchemy db instance
│   │   └── transaction.py          # Transaction ORM model
│   ├── routes/
│   │   ├── transactions.py         # CRUD + dashboard endpoints
│   │   ├── reports.py              # Monthly report endpoint
│   │   └── exports.py              # CSV + PDF export endpoints
│   └── services/
│       ├── transaction_service.py  # Business logic + validation
│       ├── analytics_service.py    # Trend, reports, predictions
│       └── export_service.py       # CSV/PDF generation
│
└── frontend/
    ├── templates/
    │   └── index.html              # Single-page app shell
    └── static/
        ├── css/style.css           # Full dark dashboard stylesheet
        └── js/
            ├── api.js              # Fetch-based API client
            ├── charts.js           # Chart.js wrappers
            └── app.js              # Page logic, state, interactions
```

---

## 🚀 Quick Start (Local)

### 1. Clone / download the project

```bash
cd fintrack
```

### 2. Create a virtual environment

```bash
python -m venv venv

# macOS/Linux

source venv/bin/activate

# Windows
venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the app

```bash
python app.py
```

### 5. Open in browser

```
http://127.0.0.1:5000
```

The app auto-seeds demo data on first launch so the dashboard is populated immediately.

---

## 🔗 REST API Reference

| Method   | Endpoint                          | Description                        |
|----------|-----------------------------------|------------------------------------|
| `GET`    | `/api/transactions`               | List all (supports filters)        |
| `POST`   | `/api/add-transaction`            | Create new transaction             |
| `PUT`    | `/api/update-transaction/<id>`    | Update transaction by ID           |
| `DELETE` | `/api/delete-transaction/<id>`    | Delete transaction by ID           |
| `GET`    | `/api/dashboard`                  | Summary + trend + category data    |
| `GET`    | `/api/reports/monthly?year=&month=` | Full monthly report              |
| `GET`    | `/api/predictions`                | Next-month expense estimates       |
| `GET`    | `/api/export/csv`                 | Download CSV                       |
| `GET`    | `/api/export/pdf`                 | Download PDF report                |

### Filter parameters (GET /api/transactions)

| Param       | Example          | Description          |
|-------------|------------------|----------------------|
| `category`  | `Food`           | Filter by category   |
| `type`      | `expense`        | `income` or `expense`|
| `date_from` | `2025-01-01`     | ISO date lower bound |
| `date_to`   | `2025-03-31`     | ISO date upper bound |

### POST /api/add-transaction — Body

```json
{
  "amount":      1500,
  "type":        "expense",
  "category":    "Food",
  "date":        "2025-04-10",
  "description": "Swiggy order"
}
```

---

## ☁️ Deployment

### Option A — Render (recommended, free tier)

1. Push the project to a GitHub repo
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your repo
4. Set:
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `gunicorn app:create_app()`
5. Add env var: `SECRET_KEY=your-random-secret`
6. Deploy ✅

Add `gunicorn` to requirements.txt for production:
```
gunicorn==21.2.0
```

### Option B — Railway

```bash
railway init
railway up
```

### Option C — Docker

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
EXPOSE 5000
CMD ["python", "app.py"]
```

```bash
docker build -t fintrack .
docker run -p 5000:5000 fintrack
```

---

## ⚙️ Configuration

Edit `app.py` to change:

| Setting               | Default              | Description               |
|-----------------------|----------------------|---------------------------|
| Database URI          | `sqlite:///fintrack.db` | Swap for PostgreSQL URI |
| `SECRET_KEY`          | `dev-secret-key`    | Set via env var in prod   |
| Port                  | `5000`               | Change in `app.run()`     |

### Switch to PostgreSQL

```python
app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql://user:pass@host/dbname"
```

Add `psycopg2-binary` to requirements.txt.

---

## 🎯 Features

- ✅ Track income & expenses
- ✅ 15 categories (Food, Rent, Salary, Travel, etc.)
- ✅ Add, edit, delete transactions
- ✅ Dashboard with totals and balance
- ✅ Monthly trend chart (bar + line, Chart.js)
- ✅ Category pie / doughnut chart
- ✅ Filter by date range, category, type
- ✅ Monthly reports with savings rate
- ✅ Expense predictions (weighted trend, 3-month window)
- ✅ Export to CSV
- ✅ Export to PDF (reportlab)
- ✅ Responsive dark dashboard UI
- ✅ Toast notifications
- ✅ Edit modal
- ✅ Demo data auto-seeded on first run
