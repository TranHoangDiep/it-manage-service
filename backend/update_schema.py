from app import app
from models.ticket import db

with app.app_context():
    try:
        db.create_all()
        print("Database schema updated successfully.")
    except Exception as e:
        print(f"Error updating schema: {e}")
