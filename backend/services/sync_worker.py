"""
Optimized Sync Worker - ITSM Ticket Synchronization
Uses UPSERT logic to avoid duplicate key errors and improve performance
"""
import requests
import json
import time
from datetime import datetime, timedelta
from models.ticket import db, Ticket, Customer, Engineer
from sqlalchemy.dialects.postgresql import insert as pg_insert


def fetch_from_sdp(app, page_size=100, max_pages=20):
    """
    Fetches real ticket data from ManageEngine ServiceDesk Plus API V3.
    Supports pagination for large datasets.
    """
    api_key = app.config['SDP_API_KEY']
    base_url = app.config['SDP_BASE_URL']
    
    if not api_key or api_key == 'YOUR_SDP_API_KEY_HERE':
        print("WARNING: SDP API Key not configured. Skipping real sync.")
        return None

    headers = {
        "authtoken": api_key,
        "Accept": "application/vnd.manageengine.sdp.v3+json"
    }

    all_tickets = []
    
    for page in range(max_pages):
        params = {
            "input_data": json.dumps({
                "list_info": {
                    "row_count": page_size,
                    "start_index": page * page_size + 1,
                    "sort_field": "created_time",
                    "sort_order": "desc"
                }
            })
        }

        try:
            url = f"{base_url}/requests"
            if page == 0:
                print(f"Fetching tickets from {url}...")
            
            response = requests.get(url, headers=headers, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            tickets = data.get('requests', [])
            if not tickets:
                break
                
            all_tickets.extend(tickets)
            
            # Check if we got less than requested (last page)
            if len(tickets) < page_size:
                break
                
        except requests.exceptions.Timeout:
            print(f"Timeout fetching page {page + 1}")
            break
        except Exception as e:
            print(f"Error fetching page {page + 1}: {e}")
            break
    
    return all_tickets if all_tickets else None


def get_val(obj, keys, default=None):
    """Safely get nested dictionary value"""
    for key in keys:
        if obj and isinstance(obj, dict):
            obj = obj.get(key)
        else:
            return default
    return obj or default


def upsert_ticket(ticket_data):
    """
    Insert or update a ticket using PostgreSQL upsert.
    Returns True if successful.
    """
    stmt = pg_insert(Ticket).values(ticket_data)
    stmt = stmt.on_conflict_do_update(
        index_elements=['id'],
        set_={
            'title': stmt.excluded.title,
            'description': stmt.excluded.description,
            'customer_id': stmt.excluded.customer_id,
            'customer_name': stmt.excluded.customer_name,
            'engineer_id': stmt.excluded.engineer_id,
            'engineer_name': stmt.excluded.engineer_name,
            'status': stmt.excluded.status,
            'priority': stmt.excluded.priority,
            'category': stmt.excluded.category,
            'response_time_minutes': stmt.excluded.response_time_minutes,
            'resolve_time_hours': stmt.excluded.resolve_time_hours,
            'time_elapsed_minutes': stmt.excluded.time_elapsed_minutes,
            'is_overdue': stmt.excluded.is_overdue,
        }
    )
    db.session.execute(stmt)


def sync_tickets(app):
    """
    Optimized sync function using upsert logic.
    - No more DELETE ALL before insert
    - Handles duplicates gracefully
    - Updates existing tickets instead of failing
    """
    with app.app_context():
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Starting ITSM sync...")
        
        sdp_tickets = fetch_from_sdp(app)
        
        if not sdp_tickets:
            print("No data fetched or API error.")
            return {'success': False, 'error': 'No data'}
        
        unique_customers = {}
        unique_engineers = {}
        synced_count = 0
        error_count = 0
        
        for sdp_t in sdp_tickets:
            try:
                created_ms = get_val(sdp_t, ['created_time', 'value'])
                created_at = datetime.fromtimestamp(float(created_ms) / 1000.0) if created_ms else datetime.now()

                cust_id = str(get_val(sdp_t, ['account', 'id'], 'N/A'))
                cust_name = get_val(sdp_t, ['account', 'name'], 'General')
                eng_id = str(get_val(sdp_t, ['technician', 'id'], 'Unassigned'))
                eng_name = get_val(sdp_t, ['technician', 'name'], 'Unassigned')
                
                status = get_val(sdp_t, ['status', 'name'], 'Open')
                
                # ===== SLA Calculation from ManageEngine =====
                # Get response times
                response_due_ms = get_val(sdp_t, ['first_response_due_by_time', 'value'])
                responded_ms = get_val(sdp_t, ['responded_time', 'value'])
                
                # Get resolution times
                resolution_due_ms = get_val(sdp_t, ['resolution_due_by_time', 'value'])
                resolved_ms = get_val(sdp_t, ['resolved_time', 'value'])
                
                # Calculate response time (minutes from created to first response)
                response_time = None
                if responded_ms and created_ms:
                    try:
                        responded_at = datetime.fromtimestamp(float(responded_ms) / 1000.0)
                        response_time = int((responded_at - created_at).total_seconds() / 60)
                    except:
                        pass
                
                # Calculate resolve time (hours from created to resolved)
                resolve_time = None
                if resolved_ms and created_ms:
                    try:
                        resolved_at = datetime.fromtimestamp(float(resolved_ms) / 1000.0)
                        resolve_time = round((resolved_at - created_at).total_seconds() / 3600, 2)
                    except:
                        pass
                
                # If ticket is closed but no resolved_time, estimate from status change
                if status in ['Resolved', 'Closed'] and resolve_time is None:
                    completed_ms = get_val(sdp_t, ['completed_time', 'value'])
                    if completed_ms:
                        try:
                            completed_at = datetime.fromtimestamp(float(completed_ms) / 1000.0)
                            resolve_time = round((completed_at - created_at).total_seconds() / 3600, 2)
                        except:
                            pass
                
                # Get actual workload time (time_elapsed from ManageEngine)
                # ManageEngine stores as { "value": minutes } or as a string
                time_elapsed = None
                time_elapsed_raw = get_val(sdp_t, ['time_elapsed', 'value'])
                if time_elapsed_raw is None:
                    time_elapsed_raw = sdp_t.get('time_elapsed')
                if time_elapsed_raw:
                    try:
                        # Could be in format "HH:MM:SS" or just minutes
                        if isinstance(time_elapsed_raw, str) and ':' in time_elapsed_raw:
                            parts = time_elapsed_raw.split(':')
                            time_elapsed = int(parts[0]) * 60 + int(parts[1])
                        else:
                            time_elapsed = int(float(time_elapsed_raw))
                    except:
                        pass

                # Get is_overdue from ManageEngine (determines SLA status)
                is_overdue = sdp_t.get('is_overdue', False)
                # Handle case where it might be a string "true"/"false"
                if isinstance(is_overdue, str):
                    is_overdue = is_overdue.lower() == 'true'

                ticket_data = {
                    'id': str(sdp_t.get('id')),
                    'title': sdp_t.get('subject', 'No Subject')[:500],
                    'description': sdp_t.get('description', 'No description provided.'),
                    'customer_id': cust_id,
                    'customer_name': cust_name,
                    'engineer_id': eng_id,
                    'engineer_name': eng_name,
                    'status': status,
                    'priority': get_val(sdp_t, ['priority', 'name'], 'Medium'),
                    'category': get_val(sdp_t, ['category', 'name'], 'Others'),
                    'created_at': created_at,
                    'response_time_minutes': response_time,
                    'resolve_time_hours': resolve_time,
                    'time_elapsed_minutes': time_elapsed,
                    'is_overdue': is_overdue
                }
                
                upsert_ticket(ticket_data)
                synced_count += 1
                
                # Collect unique customers/engineers
                if cust_id != 'N/A':
                    unique_customers[cust_id] = cust_name
                if eng_id != 'Unassigned':
                    unique_engineers[eng_id] = eng_name
                    
            except Exception as e:
                error_count += 1
                if error_count <= 3:
                    print(f"Error processing ticket: {e}")
        
        # Upsert customers
        for cid, cname in unique_customers.items():
            try:
                stmt = pg_insert(Customer).values(id=cid, name=cname)
                stmt = stmt.on_conflict_do_update(
                    index_elements=['id'],
                    set_={'name': stmt.excluded.name}
                )
                db.session.execute(stmt)
            except:
                pass
        
        # Upsert engineers
        for eid, ename in unique_engineers.items():
            try:
                stmt = pg_insert(Engineer).values(id=eid, name=ename, group='Support')
                stmt = stmt.on_conflict_do_update(
                    index_elements=['id'],
                    set_={'name': stmt.excluded.name}
                )
                db.session.execute(stmt)
            except:
                pass
        
        db.session.commit()
        
        result = {
            'success': True,
            'tickets': synced_count,
            'customers': len(unique_customers),
            'engineers': len(unique_engineers),
            'errors': error_count
        }
        
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Sync complete: {synced_count} tickets, {len(unique_customers)} customers, {len(unique_engineers)} engineers.")
        
        return result


def sync_data(app):
    """
    Main sync entrance. Runs in a loop with configurable interval.
    """
    with app.app_context():
        if app.config.get('USE_MOCK_DATA', False):
            print("Mode: SIMULATION (Mock data)")
            return
        
        while True:
            try:
                sync_tickets(app)
            except Exception as e:
                print(f"Sync error: {e}")
            
            # Default: sync every 5 minutes
            interval = app.config.get('SYNC_INTERVAL_SECONDS', 300)
            time.sleep(interval)
