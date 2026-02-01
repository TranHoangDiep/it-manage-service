from app import app
from services.sync_worker import sync_tickets

def full_sync():
    # TEMPORARILY increase max_pages in sync_worker for this script if needed
    # but 20 pages * 100 = 2000 is almost everything.
    # Let's just run it twice or increase it here if we could.
    # For now, let's just run the standard sync twice to be sure.
    with app.app_context():
        print("Starting full sync with updated field requirements...")
        result = sync_tickets(app)
        print(f"Sync result: {result}")

if __name__ == "__main__":
    full_sync()
