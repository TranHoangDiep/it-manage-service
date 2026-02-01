from app import app
from models.ticket import db
from sqlalchemy import text

with app.app_context():
    try:
        # Add request_type column to tickets table
        db.session.execute(text("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS request_type VARCHAR(100)"))
        db.session.execute(text("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS is_service_request BOOLEAN DEFAULT FALSE"))
        db.session.commit()
        print("Column request_type added successfully.")
    except Exception as e:
        print(f"Error adding column: {e}")
        db.session.rollback()
