"""
Alarm Notes Models - Infrastructure Alarm Management
Supports both auto-created (Critical via Alertmanager) and manual (Warning) alarms
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime
from models.ticket import db


class AlarmNote(db.Model):
    """Alarm Notes - tracks Critical (auto) and Warning (manual) alerts"""
    __tablename__ = 'alarm_note_v2'
    
    id = db.Column(db.Integer, primary_key=True)
    alarm_id = db.Column(db.String(50), unique=True, index=True)  # ALM-001
    
    # Source tracking
    source = db.Column(db.String(20), nullable=False, default='manual')  # 'alertmanager' | 'manual'
    external_id = db.Column(db.String(255), index=True)  # Alertmanager fingerprint for dedup
    
    # Alert details
    alertname = db.Column(db.String(255), nullable=False)
    severity = db.Column(db.String(20), nullable=False, default='warning')  # 'critical' | 'warning'
    target = db.Column(db.String(255))  # Host/VM/Service name
    instance = db.Column(db.String(255))  # IP:port
    job = db.Column(db.String(100))  # Prometheus job name
    
    # Labels and annotations (flexible JSON storage)
    labels = db.Column(db.JSON, default={})
    annotations = db.Column(db.JSON, default={})
    
    # CMDB linkage
    ci_id = db.Column(db.String(50), index=True)
    customer_id = db.Column(db.String(50), index=True)
    customer_name = db.Column(db.String(255))
    
    # Lifecycle
    status = db.Column(db.String(20), default='open', index=True)  # open | in_progress | resolved
    
    # Ticketing integration
    ticket_id = db.Column(db.String(50))
    ticket_url = db.Column(db.String(500))
    
    # Notes & Context
    note = db.Column(db.Text)
    root_cause = db.Column(db.Text)
    resolution = db.Column(db.Text)
    
    # Ownership
    assigned_to = db.Column(db.String(255))
    created_by = db.Column(db.String(255))
    
    # Timestamps
    fired_at = db.Column(db.DateTime)  # When alert fired (from Alertmanager)
    acknowledged_at = db.Column(db.DateTime)
    resolved_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Deduplication
    occurrence_count = db.Column(db.Integer, default=1)
    last_occurrence = db.Column(db.DateTime)
    
    def to_dict(self):
        return {
            'id': self.id,
            'alarm_id': self.alarm_id,
            'source': self.source,
            'alertname': self.alertname,
            'severity': self.severity,
            'target': self.target,
            'instance': self.instance,
            'ci_id': self.ci_id,
            'customer_id': self.customer_id,
            'customer_name': self.customer_name,
            'status': self.status,
            'ticket_id': self.ticket_id,
            'note': self.note,
            'root_cause': self.root_cause,
            'resolution': self.resolution,
            'assigned_to': self.assigned_to,
            'created_by': self.created_by,
            'fired_at': self.fired_at.isoformat() if self.fired_at else None,
            'acknowledged_at': self.acknowledged_at.isoformat() if self.acknowledged_at else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'occurrence_count': self.occurrence_count,
        }


class AlarmHistory(db.Model):
    """Audit trail for alarm notes"""
    __tablename__ = 'alarm_history'
    
    id = db.Column(db.Integer, primary_key=True)
    alarm_id = db.Column(db.String(50), index=True, nullable=False)
    action = db.Column(db.String(50), nullable=False)  # created | status_changed | note_added | resolved
    old_value = db.Column(db.String(255))
    new_value = db.Column(db.String(255))
    changed_by = db.Column(db.String(255))
    changed_at = db.Column(db.DateTime, default=datetime.utcnow)
    comment = db.Column(db.Text)
    
    def to_dict(self):
        return {
            'id': self.id,
            'alarm_id': self.alarm_id,
            'action': self.action,
            'old_value': self.old_value,
            'new_value': self.new_value,
            'changed_by': self.changed_by,
            'changed_at': self.changed_at.isoformat() if self.changed_at else None,
            'comment': self.comment,
        }
