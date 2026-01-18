from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

# ==================== PROJECT MODELS ====================

class Project(db.Model):
    __tablename__ = 'projects'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String(50), default='Active')  # Active, Planning, Completed
    start_date = db.Column(db.String(20))
    
    # Lead info
    lead_name = db.Column(db.String(255))
    lead_role = db.Column(db.String(100))
    lead_phone = db.Column(db.String(20))
    lead_email = db.Column(db.String(255))
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    members = db.relationship('ProjectMember', backref='project', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "status": self.status,
            "startDate": self.start_date,
            "lead": {
                "name": self.lead_name,
                "role": self.lead_role,
                "phone": self.lead_phone,
                "email": self.lead_email
            },
            "members": [m.to_dict() for m in self.members]
        }


class ProjectMember(db.Model):
    __tablename__ = 'project_members'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    email = db.Column(db.String(255))

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "role": self.role,
            "phone": self.phone,
            "email": self.email
        }


# ==================== CUSTOMER CONTACT MODELS ====================

class CustomerContact(db.Model):
    __tablename__ = 'customer_contacts'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), nullable=False)
    industry = db.Column(db.String(100))
    address = db.Column(db.String(500))
    website = db.Column(db.String(255))
    status = db.Column(db.String(50), default='Active')
    
    # IT Head info
    it_head_name = db.Column(db.String(255))
    it_head_title = db.Column(db.String(100))
    it_head_phone = db.Column(db.String(20))
    it_head_email = db.Column(db.String(255))
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    contacts = db.relationship('Contact', backref='customer', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "industry": self.industry,
            "address": self.address,
            "website": self.website,
            "status": self.status,
            "itHead": {
                "name": self.it_head_name,
                "title": self.it_head_title,
                "phone": self.it_head_phone,
                "email": self.it_head_email
            },
            "contacts": [c.to_dict() for c in self.contacts]
        }


class Contact(db.Model):
    __tablename__ = 'contacts'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customer_contacts.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    title = db.Column(db.String(100))
    department = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    email = db.Column(db.String(255))

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "title": self.title,
            "department": self.department,
            "phone": self.phone,
            "email": self.email
        }


# ==================== ALARM NOTES MODEL ====================

class AlarmNote(db.Model):
    __tablename__ = 'alarm_notes'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    alarm_id = db.Column(db.String(20), unique=True)  # ALM-001
    alarm_name = db.Column(db.String(255), nullable=False)
    severity = db.Column(db.String(20), default='Warning')  # Critical, Warning
    target = db.Column(db.String(255))  # Server/IP
    status = db.Column(db.String(50), default='Open')  # Open, In Progress, Resolved
    ticket_id = db.Column(db.String(50))
    note = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.alarm_id,
            "alarmName": self.alarm_name,
            "severity": self.severity,
            "target": self.target,
            "status": self.status,
            "ticketId": self.ticket_id or "",
            "note": self.note or "",
            "updatedAt": self.updated_at.strftime('%Y-%m-%d %H:%M') if self.updated_at else ""
        }


# ==================== CMDB ASSET MODEL ====================

class CMDBAsset(db.Model):
    __tablename__ = 'cmdb_assets'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    asset_id = db.Column(db.String(20), unique=True)  # VC-001, HOST-001, VM-001
    asset_type = db.Column(db.String(20), nullable=False)  # vCenter, Host, VM
    name = db.Column(db.String(255), nullable=False)
    ip = db.Column(db.String(50))
    os = db.Column(db.String(100))
    cluster = db.Column(db.String(100))
    status = db.Column(db.String(50), default='Running')  # Running, Stopped, Maintenance
    cpu = db.Column(db.String(50))
    ram = db.Column(db.String(50))
    admin_name = db.Column(db.String(255))
    admin_phone = db.Column(db.String(20))
    note = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.asset_id,
            "type": self.asset_type,
            "name": self.name,
            "ip": self.ip,
            "os": self.os,
            "cluster": self.cluster,
            "status": self.status,
            "cpu": self.cpu,
            "ram": self.ram,
            "adminName": self.admin_name,
            "adminPhone": self.admin_phone,
            "note": self.note or ""
        }
