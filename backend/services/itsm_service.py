from models.ticket import db, Ticket, Customer, Engineer
from sqlalchemy import func
from datetime import datetime, timedelta

class ITSMService:
    def get_summary(self):
        # High performance aggregation via SQL
        total = db.session.query(func.count(Ticket.id)).scalar() or 0
        open_t = db.session.query(func.count(Ticket.id)).filter(Ticket.status == 'Open').scalar() or 0
        in_progress = db.session.query(func.count(Ticket.id)).filter(Ticket.status == 'In Progress').scalar() or 0
        resolved = db.session.query(func.count(Ticket.id)).filter(Ticket.status.in_(['Resolved', 'Closed'])).scalar() or 0
        
        # SLA Calculation via SQL (Response > 30 OR Resolve > 4)
        sla_breached = db.session.query(func.count(Ticket.id)).filter(
            (Ticket.response_time_minutes > 30) | (Ticket.resolve_time_hours > 4)
        ).scalar() or 0
        
        avg_mttr = db.session.query(func.avg(Ticket.resolve_time_hours)).filter(
            Ticket.resolve_time_hours.isnot(None)
        ).scalar() or 0

        # Trend data: Last 7 days
        today = datetime.now().date()
        trend = []
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            start_dt = datetime.combine(day, datetime.min.time())
            end_dt = datetime.combine(day, datetime.max.time())
            
            count = db.session.query(func.count(Ticket.id)).filter(
                Ticket.created_at >= start_dt,
                Ticket.created_at <= end_dt
            ).scalar() or 0
            
            sla_met = db.session.query(func.count(Ticket.id)).filter(
                Ticket.created_at >= start_dt,
                Ticket.created_at <= end_dt,
                Ticket.response_time_minutes <= 30,
                (Ticket.resolve_time_hours <= 4) | (Ticket.resolve_time_hours.is_(None))
            ).scalar() or 0
            
            trend.append({
                "name": day.strftime('%a'),
                "tickets": count,
                "sla": sla_met
            })
        
        # Priority distribution via SQL
        priority_dist = db.session.query(
            Ticket.priority,
            func.count(Ticket.id).label('count')
        ).group_by(Ticket.priority).all()
        
        priority_data = {p.priority if p.priority else 'Medium': p.count for p in priority_dist}

        # Technician Performance (Summary for Dashboard)
        tech_performance = db.session.query(
            Ticket.engineer_name.label('name'),
            func.count(Ticket.id).label('total'),
            func.sum(db.case((Ticket.status == 'Open', 1), else_=0)).label('open'),
            func.sum(db.case((Ticket.status.in_(['Resolved', 'Closed']), 1), else_=0)).label('closed'),
            func.sum(db.case(((Ticket.response_time_minutes > 30) | (Ticket.resolve_time_hours > 4), 1), else_=0)).label('breached'),
            func.avg(Ticket.resolve_time_hours).label('avg_mttr')
        ).group_by(Ticket.engineer_name).order_by(func.count(Ticket.id).desc()).limit(10).all()

        # Category Distribution
        category_dist = db.session.query(
            Ticket.category,
            func.count(Ticket.id).label('count')
        ).group_by(Ticket.category).order_by(func.count(Ticket.id).desc()).limit(10).all()

        # Top 10 High-Load Customers
        top_customers = db.session.query(
            Ticket.customer_id,
            Ticket.customer_name.label('name'),
            func.count(Ticket.id).label('total'),
            func.sum(db.case(((Ticket.response_time_minutes > 30) | (Ticket.resolve_time_hours > 4), 1), else_=0)).label('breached')
        ).group_by(Ticket.customer_id, Ticket.customer_name).order_by(func.count(Ticket.id).desc()).limit(10).all()

        # Priority SLA Breakdown
        priority_sla_raw = db.session.query(
            Ticket.priority,
            func.count(Ticket.id).label('total'),
            func.sum(db.case(((Ticket.response_time_minutes > 30) | (Ticket.resolve_time_hours > 4), 1), else_=0)).label('breached')
        ).group_by(Ticket.priority).all()

        return {
            "total": total,
            "open": open_t,
            "in_progress": in_progress,
            "resolved": resolved,
            "sla_breached": sla_breached,
            "avg_mttr_hours": round(float(avg_mttr), 1) if avg_mttr else 0,
            "trend": trend,
            "priority_distribution": [{"priority": k, "value": v} for k, v in priority_data.items()],
            "category_distribution": [{"name": c.category or 'Others', "value": c.count} for c in category_dist],
            "priority_sla": [{
                "priority": p.priority or 'Medium',
                "sla_percent": round((p.total - (p.breached or 0)) / p.total * 100, 1) if p.total > 0 else 100
            } for p in priority_sla_raw],
            "top_customers": [{
                "id": c.customer_id,
                "name": c.name,
                "total": c.total,
                "sla_percent": round((c.total - (c.breached or 0)) / c.total * 100, 1) if c.total > 0 else 100
            } for c in top_customers],
            "technician_performance": [{
                "name": t.name,
                "open": int(t.open),
                "closed": int(t.closed),
                "sla_percent": round((t.total - t.breached) / t.total * 100, 1) if t.total > 0 else 100,
                "avg_mttr": round(float(t.avg_mttr or 0), 1)
            } for t in tech_performance],
            "monitoring_alerts": [
                {"source": "Prometheus", "alert": "High CPU Usage", "severity": "Critical", "time": "2 mins ago"},
                {"source": "Zabbix", "alert": "Network Latency", "severity": "Warning", "time": "5 mins ago"},
                {"source": "Wazuh", "alert": "Brute Force Attempt", "severity": "High", "time": "12 mins ago"}
            ]
        }

    def get_customers(self):
        # Group by calculation for all customers
        results = db.session.query(
            Ticket.customer_id,
            Ticket.customer_name,
            func.count(Ticket.id).label('total'),
            func.sum(db.case((Ticket.status == 'Open', 1), else_=0)).label('open'),
            func.sum(db.case((Ticket.status.in_(['Resolved', 'Closed']), 1), else_=0)).label('closed'),
            func.sum(db.case(((Ticket.response_time_minutes > 30) | (Ticket.resolve_time_hours > 4), 1), else_=0)).label('breached'),
            func.avg(Ticket.resolve_time_hours).label('avg_reso')
        ).group_by(Ticket.customer_id, Ticket.customer_name).all()
        
        return [{
            "customer_id": r.customer_id,
            "customer_name": r.customer_name,
            "total_tickets": r.total,
            "open": int(r.open),
            "closed": int(r.closed),
            "sla_breached": int(r.breached),
            "sla_percent": round((r.total - r.breached) / r.total * 100, 1) if r.total > 0 else 100,
            "avg_resolve_hours": round(float(r.avg_reso), 1) if r.avg_reso else 0
        } for r in results]

    def get_engineers(self):
        results = db.session.query(
            Engineer.id,
            Engineer.name,
            Engineer.group,
            Engineer.level,
            func.count(Ticket.id).label('total'),
            func.sum(db.case(((Ticket.response_time_minutes > 30) | (Ticket.resolve_time_hours > 4), 1), else_=0)).label('breached'),
            func.count(db.distinct(Ticket.customer_id)).label('cust_count')
        ).join(Ticket, Engineer.id == Ticket.engineer_id, isouter=True)\
         .group_by(Engineer.id).all()
        
        return [{
            "engineer_id": r.id,
            "engineer_name": r.name,
            "group": r.group,
            "level": r.level,
            "total_tickets": r.total,
            "sla_percent": round((r.total - r.breached) / r.total * 100, 1) if r.total > 0 else 100,
            "customers_supported": r.cust_count
        } for r in results]

    def get_customer_detail(self, customer_id):
        # Summary for specific customer
        summary = db.session.query(
            func.count(Ticket.id).label('total'),
            func.sum(db.case((Ticket.status == 'Open', 1), else_=0)).label('open'),
            func.sum(db.case((Ticket.status.in_(['Resolved', 'Closed']), 1), else_=0)).label('closed'),
            func.sum(db.case(((Ticket.response_time_minutes > 30) | (Ticket.resolve_time_hours > 4), 1), else_=0)).label('breached')
        ).filter(Ticket.customer_id == customer_id).first()
        
        # Get customer name
        cust_info = db.session.query(Ticket.customer_name).filter(Ticket.customer_id == customer_id).first()
        cust_name = cust_info.customer_name if cust_info else "Unknown Client"
        
        if not summary or summary.total == 0:
            return None
            
        techs = db.session.query(
            Ticket.engineer_name.label('name'),
            func.count(Ticket.id).label('handled'),
            func.sum(db.case(((Ticket.response_time_minutes > 30) | (Ticket.resolve_time_hours > 4), 1), else_=0)).label('breached'),
            func.avg(Ticket.resolve_time_hours).label('avg_reso')
        ).filter(Ticket.customer_id == customer_id).group_by(Ticket.engineer_name).all()
        
        return {
            "summary": {
                "name": cust_name,
                "total": summary.total,
                "open": int(summary.open or 0),
                "closed": int(summary.closed or 0),
                "sla_breached": int(summary.breached or 0),
                "sla_percent": round((summary.total - summary.breached) / summary.total * 100, 1)
            },
            "technicians": [{
                "name": t.name,
                "handled": t.handled,
                "sla_breached": int(t.breached or 0),
                "avg_resolve_hours": round(float(t.avg_reso), 1) if t.avg_reso else 0
            } for t in techs],
            "sla_breakdown": {
                "met": summary.total - summary.breached,
                "breached": int(summary.breached or 0)
            },
            "trend": []
        }

    def get_engineer_detail(self, engineer_id):
        eng = Engineer.query.get(engineer_id)
        if not eng: return None
        
        summary = db.session.query(
            func.count(Ticket.id).label('total'),
            func.sum(db.case((Ticket.status == 'Open', 1), else_=0)).label('open'),
            func.sum(db.case((Ticket.status.in_(['Resolved', 'Closed']), 1), else_=0)).label('closed'),
            func.sum(db.case(((Ticket.response_time_minutes > 30) | (Ticket.resolve_time_hours > 4), 1), else_=0)).label('breached')
        ).filter(Ticket.engineer_id == engineer_id).first()
        
        priority_dist = db.session.query(
            Ticket.priority,
            func.count(Ticket.id).label('count')
        ).filter(Ticket.engineer_id == engineer_id).group_by(Ticket.priority).all()
        
        cust_breakdown = db.session.query(
            Ticket.customer_name,
            func.count(Ticket.id).label('handled'),
            func.sum(db.case(((Ticket.response_time_minutes > 30) | (Ticket.resolve_time_hours > 4), 1), else_=0)).label('breached')
        ).filter(Ticket.engineer_id == engineer_id).group_by(Ticket.customer_name).all()
        
        total_tickets = summary.total or 0
        return {
            "summary": {
                "name": eng.name,
                "total": total_tickets,
                "open": int(summary.open or 0),
                "closed": int(summary.closed or 0),
                "sla_percent": round((total_tickets - (summary.breached or 0)) / total_tickets * 100, 1) if total_tickets > 0 else 100
            },
            "workload": {
                "tickets_per_day": round(total_tickets / 30, 1),
                "overload": (total_tickets / 30) > 15
            },
            "customers": [{
                "customer_name": c.customer_name,
                "handled": c.handled,
                "sla_breached": int(c.breached or 0)
            } for c in cust_breakdown],
            "priority_distribution": [{"priority": p.priority, "count": p.count} for p in priority_dist],
            "trend": []
        }

    def get_customer_tickets(self, customer_id):
        tickets = Ticket.query.filter_by(customer_id=customer_id).limit(100).all()
        return [t.to_dict() for t in tickets]

    def get_engineer_tickets(self, engineer_id):
        tickets = Ticket.query.filter_by(engineer_id=engineer_id).limit(100).all()
        return [t.to_dict() for t in tickets]

    def get_ticket_detail(self, ticket_id, app):
        import requests
        ticket = Ticket.query.get(ticket_id)
        if not ticket: 
            return None
        
        # Try to fetch real description from SDP if available
        api_key = app.config.get('SDP_API_KEY')
        base_url = app.config.get('SDP_BASE_URL')
        
        if api_key and base_url and api_key != 'YOUR_SDP_API_KEY_HERE':
            headers = {
                "authtoken": api_key,
                "Accept": "application/vnd.manageengine.sdp.v3+json"
            }
            try:
                url = f"{base_url}/requests/{ticket_id}"
                print(f"Fetching ticket detail from: {url}")
                r = requests.get(url, headers=headers, timeout=10)
                
                if r.status_code == 200:
                    sdp_data = r.json().get('request', {})
                    
                    # Get description - ManageEngine stores content in different places
                    # Priority: resolution.content > description > short_description
                    description = None
                    
                    # Check resolution.content first (main content field)
                    resolution = sdp_data.get('resolution', {})
                    if resolution and isinstance(resolution, dict):
                        description = resolution.get('content')
                    
                    # Fallback to description field
                    if not description:
                        description = sdp_data.get('description')
                    
                    # Fallback to short_description
                    if not description:
                        description = sdp_data.get('short_description')
                    
                    if description:
                        ticket.description = description
                        db.session.commit()
                        print(f"Updated ticket {ticket_id} with description length: {len(description)}")
                else:
                    print(f"Failed to fetch ticket {ticket_id}: HTTP {r.status_code}")
                    
            except requests.exceptions.Timeout:
                print(f"Timeout fetching ticket {ticket_id}")
            except Exception as e:
                print(f"Error fetching ticket {ticket_id}: {e}")
                
        return ticket.to_dict()

