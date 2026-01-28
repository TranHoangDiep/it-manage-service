from datetime import datetime
from .ticket import db

class Worklog(db.Model):
    __tablename__ = 'worklogs'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    ticket_id = db.Column(db.String(100), db.ForeignKey('tickets.id'), index=True, nullable=False)
    technician_name = db.Column(db.String(255))
    time_spent_seconds = db.Column(db.Integer, default=0)
    description = db.Column(db.Text)
    
    # Tracking for synchronization
    remote_worklog_id = db.Column(db.BigInteger, unique=True, index=True)
    remote_updated_at = db.Column(db.DateTime, index=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "ticket_id": self.ticket_id,
            "technician_name": self.technician_name,
            "time_spent_seconds": self.time_spent_seconds,
            "time_spent_formatted": self.format_time_spent(),
            "description": self.description,
            "remote_updated_at": self.remote_updated_at.isoformat() if self.remote_updated_at else None
        }

    def format_time_spent(self):
        """Returns time spent in HH:MM format"""
        if not self.time_spent_seconds:
            return "00:00"
        hours = self.time_spent_seconds // 3600
        minutes = (self.time_spent_seconds % 3600) // 60
        return f"{hours:02d}:{minutes:02d}"
