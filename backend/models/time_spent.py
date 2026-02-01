"""
TechTimeSpent Model
Stores time spent data fetched from ITSM WO_TECH_INFO table.
"""
from datetime import datetime
from models.ticket import db


class TechTimeSpent(db.Model):
    """
    Time spent record from WO_TECH_INFO table in ManageEngine.
    This represents the actual work time logged by technicians.
    """
    __tablename__ = 'tech_time_spent'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    
    # Reference to the ticket/workorder
    request_id = db.Column(db.String(50), index=True, nullable=False)
    subject = db.Column(db.String(500))
    
    # Classification
    category = db.Column(db.String(100), index=True)
    subcategory = db.Column(db.String(100))
    item = db.Column(db.String(100))
    
    # People involved
    technician = db.Column(db.String(255), index=True)
    group_name = db.Column(db.String(100), index=True)
    from_technician = db.Column(db.String(255))
    to_technician = db.Column(db.String(255))
    
    # Time spent (in minutes)
    time_spent_minutes = db.Column(db.Integer, default=0)
    
    # Remote assessment ID for sync tracking
    assessment_id = db.Column(db.String(50), unique=True, index=True)
    
    # Timestamps
    synced_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<TechTimeSpent {self.request_id}: {self.time_spent_minutes}m>'
    
    @property
    def time_spent_formatted(self):
        """Format time as HH:MM"""
        if not self.time_spent_minutes:
            return "0:00"
        hours = self.time_spent_minutes // 60
        minutes = self.time_spent_minutes % 60
        return f"{hours}:{minutes:02d}"
    
    @property
    def time_spent_hours(self):
        """Convert to hours (decimal)"""
        if not self.time_spent_minutes:
            return 0.0
        return round(self.time_spent_minutes / 60, 2)
    
    def to_dict(self):
        return {
            'id': self.id,
            'request_id': self.request_id,
            'subject': self.subject,
            'category': self.category,
            'subcategory': self.subcategory,
            'item': self.item,
            'technician': self.technician,
            'group_name': self.group_name,
            'from_technician': self.from_technician,
            'to_technician': self.to_technician,
            'time_spent_minutes': self.time_spent_minutes,
            'time_spent_hours': self.time_spent_hours,
            'time_spent_formatted': self.time_spent_formatted,
            'synced_at': self.synced_at.isoformat() if self.synced_at else None
        }
