"""
Transaction model - core data entity for FinTrack
"""

from backend.models.database import db
from datetime import date


class Transaction(db.Model):
    __tablename__ = "transactions"

    id          = db.Column(db.Integer, primary_key=True)
    amount      = db.Column(db.Float, nullable=False)
    type        = db.Column(db.String(10), nullable=False)   # "income" | "expense"
    category    = db.Column(db.String(50), nullable=False)
    date        = db.Column(db.Date, nullable=False, default=date.today)
    description = db.Column(db.String(255), nullable=True, default="")

    def to_dict(self):
        return {
            "id":          self.id,
            "amount":      self.amount,
            "type":        self.type,
            "category":    self.category,
            "date":        self.date.isoformat(),
            "description": self.description or "",
        }

    def __repr__(self):
        return f"<Transaction {self.id} {self.type} {self.amount}>"
