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
from sqlalchemy import create_engine, text
import urllib.parse
import os
import math


def fetch_from_sdp(app, page_size=100, max_pages=200):
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
    
    print(f"Starting to fetch up to {max_pages * page_size} tickets...")
    for page in range(max_pages):
        params = {
            "input_data": json.dumps({
                "list_info": {
                    "row_count": page_size,
                    "start_index": page * page_size + 1,
                    "sort_field": "created_time",
                    "sort_order": "desc",
                    "fields_required": [
                        "subject", "status", "priority", 
                        "category", "request_type", "is_service_request",
                        "technician", "account", "created_time", 
                        "first_response_due_by_time", "responded_time",
                        "due_by_time", "resolved_time",
                        "time_elapsed", "is_overdue"
                    ]
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
            
            if (page + 1) % 5 == 0:
                print(f"Fetched {page + 1} pages ({len(all_tickets) + len(data.get('requests', []))} tickets so far...)")
            
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


def parse_time_elapsed(val):
    """Convert various time formats into integer minutes (rounded half-up).

    Supports:
    - numeric minutes (int/float)
    - numeric strings ("90.5")
    - "MM:SS" (minutes and seconds)
    - "HH:MM:SS" (hours, minutes, seconds)
    - None -> 0
    """
    if val is None:
        return 0
    try:
        if isinstance(val, (int, float)):
            return int(math.floor(float(val) + 0.5))
        s = str(val).strip()
        if ':' in s:
            parts = [float(p) for p in s.split(':')]
            if len(parts) == 3:
                h, m, sec = parts
                minutes = h * 60.0 + m + sec / 60.0
                return int(math.floor(minutes + 0.5))
            if len(parts) == 2:
                m, sec = parts
                minutes = float(m) + sec / 60.0
                return int(math.floor(minutes + 0.5))
            return int(math.floor(float(s) + 0.5))
        return int(math.floor(float(s) + 0.5))
    except Exception:
        return 0


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
            'request_type': stmt.excluded.request_type,
            'is_service_request': stmt.excluded.is_service_request,
            'response_time_minutes': stmt.excluded.response_time_minutes,
            'resolve_time_hours': stmt.excluded.resolve_time_hours,
            'time_elapsed_minutes': stmt.excluded.time_elapsed_minutes,
            'is_overdue': stmt.excluded.is_overdue,
        }
    )
    db.session.execute(stmt)


def fetch_from_sql(app, limit=500):
    """
    Fetches ticket data directly from SDP MSSQL database using the user's optimized query.
    Calculates accurate timespent from WorkLogCharges.
    """
    driver = app.config.get('SDP_DB_DRIVER', 'mssql+pyodbc')
    server = app.config.get('SDP_DB_HOST')
    database = app.config.get('SDP_DB_NAME')
    user = app.config.get('SDP_DB_USER')
    password = app.config.get('SDP_DB_PASS')
    port = app.config.get('SDP_DB_PORT', '1433')

    if not all([server, database, user, password]):
        print("SQL Connection info missing. Fallback to API.")
        return None

    try:
        params = urllib.parse.quote_plus(
            f"DRIVER={{ODBC Driver 17 for SQL Server}};"
            f"SERVER={server},{port};"
            f"DATABASE={database};"
            f"UID={user};"
            f"PWD={password}"
        )
        engine = create_engine(f"{driver}:///?odbc_connect={params}")
        
        query = text(f"""
            SELECT DISTINCT TOP {limit}
                wo.WORKORDERID          AS [id],
                wo.TITLE                AS [subject],
                wo.DESCRIPTION          AS [description],
                wo.STATUSNAME           AS [status],
                pd.PRIORITYNAME         AS [priority],
                au.TECH_FIRSTNAME       AS [tech_name],
                wo.OWNERID              AS [tech_id],
                au_req.FIRST_NAME       AS [cust_name],
                wo.REQUESTERID          AS [cust_id],
                wo.CREATEDTIME          AS [created_at_ms],
                wo.DUEBYTIME            AS [due_by_ms],
                wo.COMPLETEDTIME        AS [completed_at_ms],

                /* Accurate Timespent Calculation (minutes) */
                (
                    SELECT ROUND(
                        SUM(wl.BILLABLETIME) / 60000.0,
                        2
                    )
                    FROM WorkLogCharges wl
                    WHERE wl.WORKORDERID = wo.WORKORDERID
                ) AS timespent_minutes

            FROM WorkOrder wo
            LEFT JOIN PriorityDefinition pd
                ON wo.PRIORITYID = pd.PRIORITYID

            LEFT JOIN AaaUser au
                ON wo.OWNERID = au.USER_ID

            LEFT JOIN AaaUser au_req
                ON wo.REQUESTERID = au_req.USER_ID

            ORDER BY wo.CREATEDTIME DESC;
        """)

        with engine.connect() as conn:
            result = conn.execute(query)
            tickets = []
            for row in result:
                # Convert row to dict compatible with the sync logic
                tickets.append({
                    'id': str(row.id),
                    'subject': row.subject,
                    'description': row.description,
                    'status': {'name': row.status},
                    'priority': {'name': row.priority or 'Medium'},
                    'technician': {'id': str(row.tech_id or 'Unassigned'), 'name': row.tech_name or 'Unassigned'},
                    'account': {'id': str(row.cust_id or 'N/A'), 'name': row.cust_name or 'General'},
                    'created_time': {'value': row.created_at_ms},
                    'due_by_time': {'value': row.due_by_ms},
                    'completed_time': {'value': row.completed_at_ms},
                    'time_elapsed': {'value': int(math.floor(float(row.timespent_minutes) + 0.5)) if row.timespent_minutes is not None else 0},
                    'is_overdue': False # Hard to get from this query alone without complex logic
                })
            return tickets
    except Exception as e:
        print(f"SQL Fetch Error: {e}")
        return None


def sync_tickets(app):
    """
    Optimized sync function using upsert logic.
    Supports both SQL and API fetching.
    """
    with app.app_context():
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Starting ITSM sync...")
        
        # Try SQL first if configured, fallback to API
        sdp_tickets = fetch_from_sql(app)
        if not sdp_tickets:
            print("SQL Fetch skipped or failed. Using API...")
            sdp_tickets = fetch_from_sdp(app)
        
        if not sdp_tickets:
            print("No data fetched from any source.")
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
                resolution_due_ms = get_val(sdp_t, ['due_by_time', 'value'])
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
                # Support numeric minutes, numeric strings, "MM:SS" or "HH:MM:SS"
                time_elapsed_raw = get_val(sdp_t, ['time_elapsed', 'value'])
                if time_elapsed_raw is None:
                    time_elapsed_raw = sdp_t.get('time_elapsed')
                time_elapsed = parse_time_elapsed(time_elapsed_raw)

                # Get is_overdue from ManageEngine (determines SLA status)
                is_overdue = sdp_t.get('is_overdue', False)
                # Handle case where it might be a string "true"/"false"
                if isinstance(is_overdue, str):
                    is_overdue = is_overdue.lower() == 'true'

                # Heuristic Classification for 'Others'
                req_type_obj = sdp_t.get('request_type')
                req_type = req_type_obj.get('name') if isinstance(req_type_obj, dict) else 'Others'
                is_sr = sdp_t.get('is_service_request', False)
                category_obj = sdp_t.get('category')
                category = category_obj.get('name') if isinstance(category_obj, dict) else 'Others'
                title_lower = sdp_t.get('subject', '').lower()

                # If ManageEngine already says it's a Service Request, trust it
                if req_type == 'Service Request':
                    is_sr = True
                elif req_type == 'Incident':
                    is_sr = False

                # Keywords for SR
                sr_k = ['service request', 'yêu cầu', 'request', 'checklist', 'report', 'health check', 'healthcheck', 'monitor', 'cung cấp', 'bàn giao', 'ticket', 'daily', 'weekly', 'monthly', 'patching', 'update', 'upgrade', 'báo giá', 'invoice', 'hợp đồng', 'certificate']
                # Keywords for Incident
                inc_k = ['incident', 'lỗi', 'sự cố', 'hỏng', 'error', 'failure', 'troubleshoot', 'bảo hành', 'repair', 'hỗ trợ', 'fix', 'fault', 'broken', 'replace', 'down', 'critical', 'warning', 'high', 'usage', 'disconnected', 'không vào được', 'không khởi động', 'alert', 'expired', 'timeout', 'mất kết nối']

                if req_type == 'Others' or category == 'Others':
                    if any(k in title_lower for k in sr_k):
                        req_type = 'Service Request'
                        is_sr = True
                    elif any(k in title_lower for k in inc_k):
                        req_type = 'Incident'
                        is_sr = False
                    elif 'change' in title_lower:
                        req_type = 'Change Request'
                        category = 'Change'


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
                    'category': category,
                    'request_type': req_type,
                    'is_service_request': is_sr,
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
