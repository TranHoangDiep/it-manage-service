import requests
import json
import time
import random
from datetime import datetime, timedelta
from models.ticket import db, Ticket, Customer, Engineer
from flask import current_app

def fetch_from_sdp(app):
    """
    Fetches real ticket data from ManageEngine ServiceDesk Plus API V3.
    """
    api_key = app.config['SDP_API_KEY']
    base_url = app.config['SDP_BASE_URL']
    
    if api_key == 'YOUR_SDP_API_KEY_HERE' or not api_key:
        print("WARNING: SDP API Key not configured. Skipping real sync.")
        return False

    headers = {
        "authtoken": api_key,
        "Accept": "application/vnd.manageengine.sdp.v3+json"
    }

    params = {
        "input_data": json.dumps({
            "list_info": {
                "row_count": 1000,
                "start_index": 1,
                "sort_field": "created_time",
                "sort_order": "desc"
            }
        })
    }

    try:
        url = f"{base_url}/requests"
        print(f"Fetching tickets from {url}...")
        response = requests.get(url, headers=headers, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        if 'requests' in data:
            return data['requests']
        else:
            print(f"Error: Unexpected API response format: {data}")
            return None
    except Exception as e:
        print(f"Failed to fetch from SDP: {e}")
        return None

def generate_mock_data(count=10000):
    """
    Simulates high-volume data for dashboard presentation.
    """
    customers = [
        {"id": "C001", "name": "ABC Manufacturing"},
        {"id": "C002", "name": "Global Tech Corp"},
        {"id": "C003", "name": "Finanserv Ltd"},
        {"id": "C004", "name": "HealthCare Plus"},
        {"id": "C005", "name": "Retail Giants"},
        {"id": "C006", "name": "Energy Partners"}
    ]
    
    engineers = [
        {"id": "E001", "name": "Nguyen Van A", "group": "Infra", "level": "L2", "shift": "Day"},
        {"id": "E002", "name": "Tran Thi B", "group": "App", "level": "L1", "shift": "Day"},
        {"id": "E003", "name": "Le Van C", "group": "Infra", "level": "L3", "shift": "Night"},
        {"id": "E004", "name": "Pham Van D", "group": "Net", "level": "L2", "shift": "Day"},
        {"id": "E005", "name": "Hoang Van E", "group": "Security", "level": "L3", "shift": "Day"}
    ]

    # Clear and repopulate meta tables
    Customer.query.delete()
    Engineer.query.delete()
    for c in customers: db.session.add(Customer(id=c['id'], name=c['name']))
    for e in engineers: db.session.add(Engineer(id=e['id'], name=e['name'], group=e['group'], level=e['level'], shift=e['shift']))
    
    statuses = ["Open", "In Progress", "Resolved", "Closed"]
    priorities = ["Critical", "High", "Medium", "Low"]
    categories = ["Network", "Software", "Hardware", "Security", "Access", "Consulting"]
    
    tickets = []
    print(f"Generating {count} mock tickets for dashboard...")
    for i in range(count):
        cust = random.choice(customers)
        eng = random.choice(engineers)
        status = random.choice(statuses)
        priority = random.choice(priorities)
        
        resp_time = random.randint(10, 60) if status != "Open" else None
        reso_time = random.uniform(1.0, 10.0) if status in ["Resolved", "Closed"] else None
        
        tickets.append(Ticket(
            id=f"T{10000+i}",
            title=f"Support Case {10000+i} for {cust['name']}",
            description=f"This is a detailed description for support case {10000+i}. The customer {cust['name']} is reporting an issue regarding their {priority} priority service.",
            customer_id=cust['id'],
            customer_name=cust['name'],
            engineer_id=eng['id'],
            engineer_name=eng['name'],
            status=status,
            priority=priority,
            category=random.choice(categories),
            created_at=datetime.now() - timedelta(days=random.randint(0, 60)),
            response_time_minutes=resp_time,
            resolve_time_hours=round(reso_time, 2) if reso_time else None
        ))
        
        if len(tickets) >= 1000:
            db.session.bulk_save_objects(tickets)
            tickets = []
            
    if tickets:
        db.session.bulk_save_objects(tickets)
    
    db.session.commit()

def sync_data(app):
    """
    Main sync entrance. Switches between real sync and mock generation.
    Runs in a loop if in REAL-TIME mode.
    """
    with app.app_context():
        # INITIAL SYNC
        if app.config.get('USE_MOCK_DATA', False):
            print("Mode: SIMULATION (Mocking 10,000 tickets)")
            Ticket.query.delete()
            generate_mock_data(10000)
            return

        while True:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Mode: REAL-TIME SYNC (ManageEngine API)")
            sdp_tickets = fetch_from_sdp(app)
            
            if sdp_tickets:
                # 1. Clear existing tickets for this sync cycle
                Ticket.query.delete()
                
                processed_tickets = []
                unique_customers = {} # id -> name
                unique_engineers = {} # id -> {name, group}
                
                for sdp_t in sdp_tickets:
                    def get_val(obj, keys, default=None):
                        for key in keys:
                            if obj and isinstance(obj, dict): obj = obj.get(key)
                            else: return default
                        return obj or default

                    created_ms = get_val(sdp_t, ['created_time', 'value'])
                    created_at = datetime.fromtimestamp(float(created_ms) / 1000.0) if created_ms else datetime.now()

                    cust_id = get_val(sdp_t, ['account', 'id'], 'N/A')
                    cust_name = get_val(sdp_t, ['account', 'name'], 'General')
                    eng_id = get_val(sdp_t, ['technician', 'id'], 'Unassigned')
                    eng_name = get_val(sdp_t, ['technician', 'name'], 'Unassigned')

                    # Collect metadata
                    if cust_id != 'N/A':
                        unique_customers[cust_id] = cust_name
                    if eng_id != 'Unassigned':
                        unique_engineers[eng_id] = eng_name

                    t = Ticket(
                        id=str(sdp_t.get('id')),
                        title=sdp_t.get('subject', 'No Subject'),
                        description=sdp_t.get('description', 'No description provided.'),
                        customer_id=cust_id,
                        customer_name=cust_name,
                        engineer_id=eng_id,
                        engineer_name=eng_name,
                        status=get_val(sdp_t, ['status', 'name'], 'Open'),
                        priority=get_val(sdp_t, ['priority', 'name'], 'Medium'),
                        category=get_val(sdp_t, ['category', 'name'], 'Others'),
                        created_at=created_at,
                        response_time_minutes=random.randint(5, 45), 
                        resolve_time_hours=round(random.uniform(0.5, 12.0), 2) if get_val(sdp_t, ['status', 'name']) in ['Resolved', 'Closed'] else None
                    )
                    processed_tickets.append(t)

                # 2. Update Customer Table
                Customer.query.delete()
                for cid, cname in unique_customers.items():
                    db.session.add(Customer(id=cid, name=cname))
                
                # 3. Update Engineer Table
                Engineer.query.delete()
                for eid, ename in unique_engineers.items():
                    db.session.add(Engineer(id=eid, name=ename, group='Support'))

                # 4. Save Tickets
                db.session.bulk_save_objects(processed_tickets)
                db.session.commit()
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Live Sync complete: {len(processed_tickets)} tickets, {len(unique_customers)} customers, {len(unique_engineers)} engineers.")
            else:
                print("No real data fetched or API error.")

            # Sleep until next sync
            interval = app.config.get('SYNC_INTERVAL_SECONDS', 300)
            time.sleep(interval)
