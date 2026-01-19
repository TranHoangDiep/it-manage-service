import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime
from database import db

class CI(db.Model):
    """Configuration Item - Core CMDB entity"""
    __tablename__ = 'ci'
    
    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(255), nullable=False, index=True)
    type = db.Column(db.String(50), nullable=False, index=True)  # vCenter, Host, VM, Switch, Router, etc.
    category = db.Column(db.String(50), index=True)  # Infrastructure, Network, Application, Service
    
    # Technical attributes
    ip_address = db.Column(db.String(50), index=True)
    hostname = db.Column(db.String(255))
    os_type = db.Column(db.String(100))
    model = db.Column(db.String(255))
    serial_number = db.Column(db.String(100))
    
    # Location
    location_id = db.Column(db.String(50), db.ForeignKey('location.id'))
    rack = db.Column(db.String(50))
    
    # Ownership
    customer_id = db.Column(db.String(50), index=True)
    customer_name = db.Column(db.String(255))
    
    # Admin contact
    admin_name = db.Column(db.String(255))
    admin_phone = db.Column(db.String(50))
    admin_email = db.Column(db.String(255))
    
    # Status & Lifecycle
    status = db.Column(db.String(50), default='Active', index=True)  # Active, Maintenance, Retired, Planned
    lifecycle_stage = db.Column(db.String(50), default='Production')  # Production, Development, Test, Staging
    install_date = db.Column(db.DateTime)
    warranty_end = db.Column(db.DateTime)
    eol_date = db.Column(db.DateTime)  # End of Life
    
    # Specs (flexible JSON for different CI types)
    specs = db.Column(db.JSON, default={})  # cpu, ram, storage, ports, etc.
    
    # Monitoring
    monitored = db.Column(db.Boolean, default=True)
    monitoring_job = db.Column(db.String(255))  # Prometheus job name
    last_seen = db.Column(db.DateTime)
    
    # Metadata
    notes = db.Column(db.Text)
    tags = db.Column(db.JSON, default=[])
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    location = db.relationship('Location', backref='cis')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'type': self.type,
            'category': self.category,
            'ip_address': self.ip_address,
            'hostname': self.hostname,
            'os_type': self.os_type,
            'model': self.model,
            'customer_id': self.customer_id,
            'customer_name': self.customer_name,
            'admin_name': self.admin_name,
            'admin_phone': self.admin_phone,
            'status': self.status,
            'lifecycle_stage': self.lifecycle_stage,
            'specs': self.specs,
            'monitored': self.monitored,
            'notes': self.notes,
            'tags': self.tags,
        }


class CIRelationship(db.Model):
    """Relationships between Configuration Items"""
    __tablename__ = 'ci_relationship'
    
    id = db.Column(db.Integer, primary_key=True)
    source_ci_id = db.Column(db.String(50), db.ForeignKey('ci.id'), nullable=False, index=True)
    target_ci_id = db.Column(db.String(50), db.ForeignKey('ci.id'), nullable=False, index=True)
    relationship_type = db.Column(db.String(50), nullable=False)  # runs_on, connects_to, depends_on, monitored_by
    direction = db.Column(db.String(20), default='forward')  # forward, backward, bidirectional
    description = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    source_ci = db.relationship('CI', foreign_keys=[source_ci_id], backref='outgoing_relationships')
    target_ci = db.relationship('CI', foreign_keys=[target_ci_id], backref='incoming_relationships')


class Location(db.Model):
    """Physical locations for CMDB assets"""
    __tablename__ = 'location'
    
    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    type = db.Column(db.String(50))  # DataCenter, Office, Rack, Room
    parent_id = db.Column(db.String(50), db.ForeignKey('location.id'))
    address = db.Column(db.String(500))
    city = db.Column(db.String(100))
    country = db.Column(db.String(100))
    contact_name = db.Column(db.String(255))
    contact_phone = db.Column(db.String(50))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    children = db.relationship('Location', backref=db.backref('parent', remote_side=[id]))


class Service(db.Model):
    """Service Catalog - Services offered to customers"""
    __tablename__ = 'service'
    
    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(100))  # Monitoring, Backup, Security, Cloud, Application
    type = db.Column(db.String(50))  # Managed, Co-managed, Self-service
    
    # SLA
    sla_id = db.Column(db.String(50), db.ForeignKey('sla.id'))
    
    # Status
    status = db.Column(db.String(50), default='Active')  # Active, Deprecated, Planned
    
    # Pricing (optional)
    pricing_model = db.Column(db.String(50))  # Monthly, Annual, Per-asset
    base_price = db.Column(db.Float)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class CustomerService(db.Model):
    """Services subscribed by customers"""
    __tablename__ = 'customer_service'
    
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.String(50), nullable=False, index=True)
    service_id = db.Column(db.String(50), db.ForeignKey('service.id'), nullable=False)
    
    # Contract details
    start_date = db.Column(db.DateTime)
    end_date = db.Column(db.DateTime)
    status = db.Column(db.String(50), default='Active')  # Active, Suspended, Expired
    
    # Custom SLA override
    custom_sla_id = db.Column(db.String(50), db.ForeignKey('sla.id'))
    
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class SLA(db.Model):
    """Service Level Agreements"""
    __tablename__ = 'sla'
    
    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    
    # Response time targets (in minutes)
    response_critical = db.Column(db.Integer, default=15)
    response_high = db.Column(db.Integer, default=30)
    response_medium = db.Column(db.Integer, default=60)
    response_low = db.Column(db.Integer, default=240)
    
    # Resolution time targets (in hours)
    resolution_critical = db.Column(db.Integer, default=4)
    resolution_high = db.Column(db.Integer, default=8)
    resolution_medium = db.Column(db.Integer, default=24)
    resolution_low = db.Column(db.Integer, default=72)
    
    # Uptime target (percentage)
    uptime_target = db.Column(db.Float, default=99.9)
    
    # Support hours
    support_hours = db.Column(db.String(50), default='24x7')  # 24x7, 8x5, etc.
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Alarm(db.Model):
    """Alarms from monitoring systems"""
    __tablename__ = 'alarm'
    
    id = db.Column(db.Integer, primary_key=True)
    external_id = db.Column(db.String(255), index=True)  # ID from source system
    
    # Source
    source = db.Column(db.String(50))  # prometheus, zabbix, vcenter, etc.
    alertname = db.Column(db.String(255), nullable=False, index=True)
    
    # Severity
    severity = db.Column(db.String(20), index=True)  # critical, warning, info
    
    # CI Link
    ci_id = db.Column(db.String(50), db.ForeignKey('ci.id'), index=True)
    instance = db.Column(db.String(255))  # IP or hostname from alert
    
    # Customer (derived from CI)
    customer_id = db.Column(db.String(50), index=True)
    
    # Details
    message = db.Column(db.Text)
    labels = db.Column(db.JSON, default={})
    annotations = db.Column(db.JSON, default={})
    
    # Status
    status = db.Column(db.String(20), default='firing', index=True)  # firing, resolved, acknowledged
    acknowledged_by = db.Column(db.String(255))
    acknowledged_at = db.Column(db.DateTime)
    
    # Ticket link
    ticket_id = db.Column(db.String(50), index=True)
    
    # Timestamps
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    ended_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Correlation
    parent_alarm_id = db.Column(db.Integer, db.ForeignKey('alarm.id'))
    occurrence_count = db.Column(db.Integer, default=1)
    
    ci = db.relationship('CI', backref='alarms')


class AlarmRule(db.Model):
    """Auto-ticket rules for alarms"""
    __tablename__ = 'alarm_rule'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    
    # Matching criteria
    alertname_pattern = db.Column(db.String(255))  # regex pattern
    severity = db.Column(db.String(20))
    customer_id = db.Column(db.String(50))
    ci_type = db.Column(db.String(50))
    
    # Actions
    create_ticket = db.Column(db.Boolean, default=True)
    ticket_priority = db.Column(db.String(20))
    ticket_category = db.Column(db.String(100))
    assign_to = db.Column(db.String(255))
    notify_webhook = db.Column(db.String(500))
    
    # Status
    enabled = db.Column(db.Boolean, default=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
