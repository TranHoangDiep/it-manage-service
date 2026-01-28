from models.ticket import db
from datetime import datetime

class Member(db.Model):
    __tablename__ = 'members'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    full_name = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(100)) # Job Title / Role
    birth_year = db.Column(db.Integer)
    cccd = db.Column(db.String(20))  # Căn cước công dân
    phone = db.Column(db.String(20))
    project = db.Column(db.String(255))  # Dự án đang tham gia
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "role": self.role,
            "birth_year": self.birth_year,
            "cccd": self.cccd,
            "phone": self.phone,
            "project": self.project,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
