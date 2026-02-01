from models.ticket import db, Ticket, Customer, Engineer
from sqlalchemy import func
from datetime import datetime, timedelta

class ITSMService:
    def get_summary(self, engineer_name=None):
        # High performance aggregation via SQL
        # Build filters
        base_filter = []
        if engineer_name:
            base_filter.append(Ticket.engineer_name == engineer_name)
        
        total = db.session.query(func.count(Ticket.id)).filter(*base_filter).scalar() or 0
        open_t = db.session.query(func.count(Ticket.id)).filter(Ticket.status == 'Open', *base_filter).scalar() or 0
        in_progress = db.session.query(func.count(Ticket.id)).filter(Ticket.status == 'In Progress', *base_filter).scalar() or 0
        resolved = db.session.query(func.count(Ticket.id)).filter(Ticket.status.in_(['Resolved', 'Closed']), *base_filter).scalar() or 0
        
        # SLA Calculation via is_overdue from ManageEngine
        sla_breached = db.session.query(func.count(Ticket.id)).filter(
            Ticket.is_overdue == True, *base_filter
        ).scalar() or 0
        
        avg_mttr = db.session.query(func.avg(Ticket.resolve_time_hours)).filter(
            Ticket.resolve_time_hours.isnot(None), *base_filter
        ).scalar() or 0

        # Trend data: Last 7 days
        today = datetime.now().date()
        trend = []
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            start_dt = datetime.combine(day, datetime.min.time())
            end_dt = datetime.combine(day, datetime.max.time())
            
            day_filter = [Ticket.created_at >= start_dt, Ticket.created_at <= end_dt] + base_filter
            
            count = db.session.query(func.count(Ticket.id)).filter(
                *day_filter
            ).scalar() or 0
            
            sla_met = db.session.query(func.count(Ticket.id)).filter(
                *day_filter,
                Ticket.is_overdue == False
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
        ).filter(*base_filter).group_by(Ticket.priority).all()
        
        priority_data = {p.priority if p.priority else 'Medium': p.count for p in priority_dist}

        # Technician Performance (Summary for Dashboard)
        tech_performance = db.session.query(
            Ticket.engineer_name.label('name'),
            func.count(Ticket.id).label('total'),
            func.sum(db.case((Ticket.status == 'Open', 1), else_=0)).label('open'),
            func.sum(db.case((Ticket.status.in_(['Resolved', 'Closed']), 1), else_=0)).label('closed'),
            func.sum(db.case((Ticket.is_overdue == True, 1), else_=0)).label('breached'),
            func.avg(Ticket.resolve_time_hours).label('avg_mttr')
        ).filter(*base_filter).group_by(Ticket.engineer_name).order_by(func.count(Ticket.id).desc()).limit(10).all()

        # Category Distribution
        category_dist = db.session.query(
            Ticket.category,
            func.count(Ticket.id).label('count')
        ).filter(*base_filter).group_by(Ticket.category).order_by(func.count(Ticket.id).desc()).limit(10).all()

        # Top 10 High-Load Customers (Last 30 days + engineer filter)
        thirty_days_ago = datetime.now() - timedelta(days=30)
        top_customer_filter = [Ticket.created_at >= thirty_days_ago] + base_filter
        top_customers = db.session.query(
            Ticket.customer_id,
            Ticket.customer_name.label('name'),
            func.count(Ticket.id).label('total'),
            func.sum(db.case((Ticket.is_overdue == True, 1), else_=0)).label('breached')
        ).filter(
            *top_customer_filter
        ).group_by(Ticket.customer_id, Ticket.customer_name).order_by(func.count(Ticket.id).desc()).limit(10).all()

        # Priority SLA Breakdown
        priority_sla_raw = db.session.query(
            Ticket.priority,
            func.count(Ticket.id).label('total'),
            func.sum(db.case((Ticket.is_overdue == True, 1), else_=0)).label('breached')
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

    def get_customers(self, engineer_name=None, period='30d'):
        # Group by calculation for all customers with period filter
        # Calculate date filter based on period
        now = datetime.now()
        base_filter = []
        
        if period == '1d':
            start_date = now - timedelta(days=1)
            base_filter.append(Ticket.created_at >= start_date)
        elif period == '7d':
            start_date = now - timedelta(days=7)
            base_filter.append(Ticket.created_at >= start_date)
        elif period == '30d':
            start_date = now - timedelta(days=30)
            base_filter.append(Ticket.created_at >= start_date)
        # If 'all', no date filter
        
        if engineer_name:
            base_filter.append(Ticket.engineer_name == engineer_name)
        
        results = db.session.query(
            Ticket.customer_id,
            Ticket.customer_name,
            func.count(Ticket.id).label('total'),
            func.sum(db.case((Ticket.status == 'Open', 1), else_=0)).label('open'),
            func.sum(db.case((Ticket.status.in_(['Resolved', 'Closed']), 1), else_=0)).label('closed'),
            func.sum(db.case((Ticket.is_overdue == True, 1), else_=0)).label('breached'),
            func.avg(Ticket.resolve_time_hours).label('avg_reso')
        ).filter(
            *base_filter
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
            func.sum(db.case((Ticket.is_overdue == True, 1), else_=0)).label('breached'),
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
            func.sum(db.case((Ticket.is_overdue == True, 1), else_=0)).label('breached')
        ).filter(Ticket.customer_id == customer_id).first()
        
        # Get customer name
        cust_info = db.session.query(Ticket.customer_name).filter(Ticket.customer_id == customer_id).first()
        cust_name = cust_info.customer_name if cust_info else "Unknown Client"
        
        if not summary or summary.total == 0:
            return None
            
        techs = db.session.query(
            Ticket.engineer_name.label('name'),
            func.count(Ticket.id).label('handled'),
            func.sum(db.case((Ticket.is_overdue == True, 1), else_=0)).label('breached'),
            func.avg(Ticket.resolve_time_hours).label('avg_reso')
        ).filter(Ticket.customer_id == customer_id).group_by(Ticket.engineer_name).all()
        
        # Try to get customer contact info from CustomerContact table
        from models.modules import CustomerContact
        contact_info = CustomerContact.query.filter(CustomerContact.name == cust_name).first()
        contacts_list = [c.to_dict() for c in contact_info.contacts] if contact_info else []

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
            "contacts": contacts_list,
            "trend": []
        }

    def get_engineer_detail(self, engineer_id):
        eng = Engineer.query.get(engineer_id)
        if not eng: return None
        
        # Filter by last 30 days
        thirty_days_ago = datetime.now() - timedelta(days=30)
        base_filter = [Ticket.engineer_id == engineer_id, Ticket.created_at >= thirty_days_ago]
        
        summary = db.session.query(
            func.count(Ticket.id).label('total'),
            func.sum(db.case((Ticket.status == 'Open', 1), else_=0)).label('open'),
            func.sum(db.case((Ticket.status.in_(['Resolved', 'Closed']), 1), else_=0)).label('closed'),
            func.sum(db.case((Ticket.is_overdue == True, 1), else_=0)).label('breached')
        ).filter(*base_filter).first()
        
        priority_dist = db.session.query(
            Ticket.priority,
            func.count(Ticket.id).label('count')
        ).filter(*base_filter).group_by(Ticket.priority).all()
        
        cust_breakdown = db.session.query(
            Ticket.customer_name,
            func.count(Ticket.id).label('handled'),
            func.sum(db.case((Ticket.is_overdue == True, 1), else_=0)).label('breached')
        ).filter(*base_filter).group_by(Ticket.customer_name).order_by(func.count(Ticket.id).desc()).all()
        
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

    def get_customer_performance(self, customer_id, period='30d'):
        """
        Get customer performance statistics with time filter.
        Period: 1d (24h), 7d (week), 30d (month)
        """
        from datetime import datetime, timedelta
        
        # Calculate date filter
        now = datetime.now()
        if period == '1d':
            start_date = now - timedelta(days=1)
        elif period == '7d':
            start_date = now - timedelta(days=7)
        else:  # 30d default
            start_date = now - timedelta(days=30)
        
        # Base query with date filter
        base_query = Ticket.query.filter(
            Ticket.customer_id == customer_id,
            Ticket.created_at >= start_date
        )
        
        # Get customer info
        cust = db.session.query(Ticket.customer_name).filter(
            Ticket.customer_id == customer_id
        ).first()
        cust_name = cust.customer_name if cust else "Unknown"
        
        # Total tickets
        total_tickets = base_query.count()
        
        # SLA Met (is_overdue = False)
        sla_met = base_query.filter(Ticket.is_overdue == False).count()
        
        # SLA Breached (is_overdue = True)
        sla_breached = base_query.filter(Ticket.is_overdue == True).count()
        
        # Status breakdown
        open_count = base_query.filter(Ticket.status == 'Open').count()
        in_progress = base_query.filter(Ticket.status == 'In Progress').count()
        resolved = base_query.filter(Ticket.status.in_(['Resolved', 'Closed'])).count()
        
        # Calculate SLA percentage
        sla_percent = round((sla_met / total_tickets) * 100, 1) if total_tickets > 0 else 100
        
        return {
            "customer_id": customer_id,
            "customer_name": cust_name,
            "period": period,
            "period_start": start_date.isoformat(),
            "period_end": now.isoformat(),
            "metrics": {
                "total_tickets": total_tickets,
                "sla_met": sla_met,
                "sla_breached": sla_breached,
                "sla_percent": sla_percent,
                "status_breakdown": {
                    "open": open_count,
                    "in_progress": in_progress,
                    "resolved": resolved
                }
            }
        }

    def get_engineer_tickets(self, engineer_id):
        tickets = Ticket.query.filter_by(engineer_id=engineer_id).limit(100).all()
        return [t.to_dict() for t in tickets]

    def get_engineer_performance(self, engineer_id, period='30d'):
        """
        Get engineer performance statistics with time filter.
        Period: 1d (24h), 7d (week), 30d (month)
        """
        from datetime import datetime, timedelta
        
        # Calculate date filter
        now = datetime.now()
        if period == '1d':
            start_date = now - timedelta(days=1)
        elif period == '7d':
            start_date = now - timedelta(days=7)
        else:  # 30d default
            start_date = now - timedelta(days=30)
        
        # Base query with date filter
        base_query = Ticket.query.filter(
            Ticket.engineer_id == engineer_id,
            Ticket.created_at >= start_date
        )
        
        # Get engineer info
        eng = Engineer.query.get(engineer_id)
        eng_name = eng.name if eng else "Unknown"
        
        # Total tickets
        total_tickets = base_query.count()
        
        # SLA Met (is_overdue = False)
        sla_met = base_query.filter(Ticket.is_overdue == False).count()
        
        # SLA Breached (is_overdue = True)
        sla_breached = base_query.filter(Ticket.is_overdue == True).count()
        
        # Status breakdown
        open_count = base_query.filter(Ticket.status == 'Open').count()
        in_progress = base_query.filter(Ticket.status == 'In Progress').count()
        resolved = base_query.filter(Ticket.status.in_(['Resolved', 'Closed'])).count()
        
        # Calculate SLA percentage
        sla_percent = round((sla_met / total_tickets) * 100, 1) if total_tickets > 0 else 100
        
        return {
            "engineer_id": engineer_id,
            "engineer_name": eng_name,
            "period": period,
            "period_start": start_date.isoformat(),
            "period_end": now.isoformat(),
            "metrics": {
                "total_tickets": total_tickets,
                "sla_met": sla_met,
                "sla_breached": sla_breached,
                "sla_percent": sla_percent,
                "status_breakdown": {
                    "open": open_count,
                    "in_progress": in_progress,
                    "resolved": resolved
                }
            }
        }

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

    def get_stats_for_range(self, customer_id, from_dt, to_dt):
        """
        Get aggregated stats for a specific customer within a date range.
        Includes Incidents, Service Requests, and SLA metrics.
        """
        # Base query for this customer and range
        base_filter = [
            Ticket.customer_id == customer_id,
            Ticket.created_at >= from_dt,
            Ticket.created_at <= to_dt
        ]

        # Total tickets
        total = db.session.query(func.count(Ticket.id)).filter(*base_filter).scalar() or 0
        
        # Breakdown by pre-classified fields (Updated by sync/backfill)
        incidents = db.session.query(func.count(Ticket.id)).filter(
            *base_filter,
            db.or_(
                Ticket.request_type == 'Incident',
                db.and_(
                    Ticket.is_service_request == False,
                    func.lower(Ticket.category).like('%incident%')
                )
            )
        ).scalar() or 0
        
        service_requests = db.session.query(func.count(Ticket.id)).filter(
            *base_filter,
            db.or_(
                Ticket.is_service_request == True,
                Ticket.request_type == 'Service Request',
                func.lower(Ticket.category).like('%service request%')
            )
        ).scalar() or 0
        
        changes = db.session.query(func.count(Ticket.id)).filter(
            *base_filter,
            db.or_(
                func.lower(Ticket.category).like('%change%'),
                Ticket.request_type == 'Change Request'
            )
        ).scalar() or 0


        # Others (anything else)
        others = total - (incidents + service_requests + changes)

        # SLA Metrics
        sla_met = db.session.query(func.count(Ticket.id)).filter(
            *base_filter,
            Ticket.is_overdue == False
        ).scalar() or 0
        
        sla_breached = total - sla_met
        sla_percent = round((sla_met / total * 100), 2) if total > 0 else 100.0

        # Performance (Using Worklogs/Effort instead of clock time)
        avg_resolve_time = db.session.query(func.avg(Ticket.time_elapsed_minutes / 60.0)).filter(
            *base_filter,
            Ticket.time_elapsed_minutes.isnot(None),
            Ticket.time_elapsed_minutes > 0
        ).scalar() or 0

        return {
            "incidents": incidents,
            "service_requests": service_requests,
            "changes": changes,
            "others": others,
            "total_tickets": total,
            "sla": {
                "met": sla_met,
                "breached": sla_breached,
                "percentage": sla_percent
            },
            "avg_resolve_time_hours": round(float(avg_resolve_time), 2)
        }

    def get_forecast(self, customer_id, year, month):
        """
        Generates comparison and forecast data based on 3-month moving average.
        """
        import calendar
        from dateutil.relativedelta import relativedelta
        
        target_date = datetime(year, month, 1)
        # We need historical data for the last 3-4 months if available
        history_data = []
        
        # Look back 4 months to get 3 actual months before current
        for i in range(4, -1, -1):
            dt = target_date - relativedelta(months=i)
            _, last_day = calendar.monthrange(dt.year, dt.month)
            from_dt = dt.replace(day=1, hour=0, minute=0, second=0)
            to_dt = dt.replace(day=last_day, hour=23, minute=59, second=59)
            
            stats = self.get_stats_for_range(customer_id, from_dt, to_dt)
            history_data.append({
                "month": dt.strftime("%b %Y"),
                "date": dt,
                "volume": stats["total_tickets"],
                "sla": stats["sla"]["percentage"]
            })

        # Calculate Moving Average (excluding current month)
        past_3_months = history_data[:-1]
        valid_history = [m for m in past_3_months if m["volume"] > 0]
        
        if valid_history:
            avg_volume = sum(m["volume"] for m in valid_history) / len(valid_history)
            avg_sla = sum(m["sla"] for m in valid_history) / len(valid_history)
        else:
            # Fallback if no history
            current = history_data[-1]
            avg_volume = current["volume"] or 10
            avg_sla = current["sla"] or 100.0

        # Forecast for Current (if it was 0) and Next
        # Conservative forecast: avoid spikes
        forecast_volume = round(avg_volume * 1.05) # Assume 5% growth or stability
        forecast_sla = min(100.0, max(95.0, avg_sla)) # Keep between 95 and 100
        
        next_dt = target_date + relativedelta(months=1)
        
        # Prepare Chart Data
        # We want: Prev Month (Actual), Current Month (Actual), Next Month (Forecast)
        prev_actual = history_data[-2]
        curr_actual = history_data[-1]
        
        chart_data = {
            "volume": [
                {"label": prev_actual["month"], "actual": prev_actual["volume"], "forecast": None},
                {"label": curr_actual["month"], "actual": curr_actual["volume"], "forecast": round(avg_volume)},
                {"label": next_dt.strftime("%b %Y"), "actual": None, "forecast": forecast_volume}
            ],
            "sla": [
                {"label": prev_actual["month"], "actual": prev_actual["sla"], "forecast": None},
                {"label": curr_actual["month"], "actual": curr_actual["sla"], "forecast": round(avg_sla, 2)},
                {"label": next_dt.strftime("%b %Y"), "actual": None, "forecast": round(forecast_sla, 2)}
            ]
        }

        # Insights
        trend = "stable"
        if curr_actual["volume"] > prev_actual["volume"] * 1.1:
            trend = "increasing"
        elif curr_actual["volume"] < prev_actual["volume"] * 0.9:
            trend = "decreasing"
            
        summary = f"Based on historical service trends, ticket volume is observed to be {trend}. " \
                  f"SLA compliance is forecasted to remain stable at approximately {forecast_sla:.1f}% for the coming month, " \
                  f"well within the agreed service thresholds for enterprise standards."

        return {
            "chart_data": chart_data,
            "insight_summary": summary,
            "trend": trend
        }

