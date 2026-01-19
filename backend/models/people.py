import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime
from database import db

class Engineer(db.Model):
    """Engineers/Staff for the NOC/MSP"""
    __tablename__ = 'engineer'
    
    id = db.Column(db.String(50), primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    full_name = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(50))
    
    # Role & Level
    role = db.Column(db.String(50))  # L1 Engineer, L2 Engineer, L3 Engineer, Manager, Admin
    level = db.Column(db.Integer, default=1)  # 1, 2, 3 for support tiers
    department = db.Column(db.String(100))
    
    # Status
    status = db.Column(db.String(20), default='Active')  # Active, Inactive, On Leave
    
    # Contact
    telegram_id = db.Column(db.String(100))
    slack_id = db.Column(db.String(100))
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'full_name': self.full_name,
            'phone': self.phone,
            'role': self.role,
            'level': self.level,
            'department': self.department,
            'status': self.status,
        }


class EngineerSkill(db.Model):
    """Skills and certifications for engineers"""
    __tablename__ = 'engineer_skill'
    
    id = db.Column(db.Integer, primary_key=True)
    engineer_id = db.Column(db.String(50), db.ForeignKey('engineer.id'), nullable=False)
    skill_name = db.Column(db.String(255), nullable=False)
    skill_category = db.Column(db.String(100))  # Network, VMware, Linux, Windows, Database, Security
    proficiency = db.Column(db.Integer, default=3)  # 1-5 scale
    certified = db.Column(db.Boolean, default=False)
    certification_name = db.Column(db.String(255))
    certification_date = db.Column(db.DateTime)
    expiry_date = db.Column(db.DateTime)
    
    engineer = db.relationship('Engineer', backref='skills')


class OnDutySchedule(db.Model):
    """On-duty/shift schedules for engineers"""
    __tablename__ = 'on_duty_schedule'
    
    id = db.Column(db.Integer, primary_key=True)
    engineer_id = db.Column(db.String(50), db.ForeignKey('engineer.id'), nullable=False)
    
    # Schedule
    date = db.Column(db.Date, nullable=False, index=True)
    shift_type = db.Column(db.String(20), nullable=False)  # Day, Night, Swing
    start_time = db.Column(db.Time)
    end_time = db.Column(db.Time)
    
    # Status
    status = db.Column(db.String(20), default='Scheduled')  # Scheduled, Active, Completed, Swapped
    swap_engineer_id = db.Column(db.String(50), db.ForeignKey('engineer.id'))
    
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    engineer = db.relationship('Engineer', foreign_keys=[engineer_id], backref='schedules')
    swap_engineer = db.relationship('Engineer', foreign_keys=[swap_engineer_id])


class Contact(db.Model):
    """Contacts - Customers, Vendors, Emergency"""
    __tablename__ = 'contact'
    
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(20), nullable=False, index=True)  # customer, vendor, emergency
    
    # Basic info
    name = db.Column(db.String(255), nullable=False)
    title = db.Column(db.String(100))
    company = db.Column(db.String(255))
    department = db.Column(db.String(100))
    
    # Contact info
    email = db.Column(db.String(255))
    phone = db.Column(db.String(50))
    mobile = db.Column(db.String(50))
    
    # For customer contacts
    customer_id = db.Column(db.String(50), index=True)
    is_primary = db.Column(db.Boolean, default=False)
    
    # For vendor contacts
    vendor_type = db.Column(db.String(100))  # Hardware, Software, Service, etc.
    contract_number = db.Column(db.String(100))
    
    # For emergency contacts
    priority = db.Column(db.Integer)  # 1 = highest priority
    escalation_level = db.Column(db.Integer)  # 1, 2, 3 for escalation order
    available_24x7 = db.Column(db.Boolean, default=False)
    
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'name': self.name,
            'title': self.title,
            'company': self.company,
            'email': self.email,
            'phone': self.phone,
            'mobile': self.mobile,
            'customer_id': self.customer_id,
            'is_primary': self.is_primary,
        }


class Project(db.Model):
    """Projects - Changes, Upgrades, Implementations"""
    __tablename__ = 'project'
    
    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    
    # Type & Status
    type = db.Column(db.String(50))  # Implementation, Upgrade, Migration, Change
    status = db.Column(db.String(50), default='Planning')  # Planning, In Progress, On Hold, Completed, Cancelled
    priority = db.Column(db.String(20), default='Medium')
    
    # Customer
    customer_id = db.Column(db.String(50), index=True)
    customer_name = db.Column(db.String(255))
    
    # Team
    project_manager_id = db.Column(db.String(50), db.ForeignKey('engineer.id'))
    
    # Timeline
    start_date = db.Column(db.Date)
    target_date = db.Column(db.Date)
    actual_end_date = db.Column(db.Date)
    
    # Progress
    progress_percent = db.Column(db.Integer, default=0)
    
    # Related
    related_cis = db.Column(db.JSON, default=[])  # List of CI IDs
    related_tickets = db.Column(db.JSON, default=[])  # List of ticket IDs
    
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    project_manager = db.relationship('Engineer', backref='managed_projects')
