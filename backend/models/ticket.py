from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Ticket(db.Model):
    __tablename__ = 'tickets'
    id = db.Column(db.String(100), primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    customer_id = db.Column(db.String(50), index=True)
    customer_name = db.Column(db.String(255))
    engineer_id = db.Column(db.String(50), index=True)
    engineer_name = db.Column(db.String(255))
    status = db.Column(db.String(100), index=True)
    priority = db.Column(db.String(100), index=True)
    category = db.Column(db.String(100), index=True)
    request_type = db.Column(db.String(100), index=True)
    is_service_request = db.Column(db.Boolean, default=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    response_time_minutes = db.Column(db.Integer)
    resolve_time_hours = db.Column(db.Float)
    time_elapsed_minutes = db.Column(db.Integer)  # Actual workload time from ITSM
    is_overdue = db.Column(db.Boolean, default=False)  # SLA status from ManageEngine
    
    @property
    def sla_status(self):
        # Use is_overdue from ManageEngine API
        # is_overdue: true = Breached, is_overdue: false = Met
        if self.is_overdue:
            return "Breached"
        return "Met"

    def to_dict(self):
        return {
            "ticket_id": self.id,
            "title": self.title,
            "description": self.description,
            "customer_id": self.customer_id,
            "customer_name": self.customer_name,
            "engineer_id": self.engineer_id,
            "engineer_name": self.engineer_name,
            "status": self.status,
            "priority": self.priority,
            "category": self.category,
            "request_type": self.request_type,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "response_time_minutes": self.response_time_minutes,
            "resolve_time_hours": self.resolve_time_hours,
            "time_elapsed_minutes": self.time_elapsed_minutes,
            "time_elapsed_hours": round(self.time_elapsed_minutes / 60, 2) if self.time_elapsed_minutes else None,
            "is_overdue": self.is_overdue,
            "sla_status": self.sla_status
        }

class Customer(db.Model):
    __tablename__ = 'customers'
    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(255), nullable=False)

class Engineer(db.Model):
    __tablename__ = 'engineers'
    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    group = db.Column(db.String(100))
    level = db.Column(db.String(20))
    shift = db.Column(db.String(50))
