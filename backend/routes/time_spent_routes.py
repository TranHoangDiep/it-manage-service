"""
Time Spent API Routes
Provides endpoints to fetch and manage time spent data.
"""
from flask import Blueprint, jsonify, request
from sqlalchemy import func, desc
from models.ticket import db
from models.time_spent import TechTimeSpent
from services.time_spent_sync import TimeSpentSyncService

time_spent_bp = Blueprint('time_spent', __name__)


@time_spent_bp.route('/api/time-spent', methods=['GET'])
def get_time_spent():
    """
    Get time spent records with optional filters.
    Query params:
        - page: Page number (default: 1)
        - per_page: Items per page (default: 50)
        - technician: Filter by technician name
        - group: Filter by group name
        - category: Filter by category
        - request_id: Filter by specific ticket
    """
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        technician = request.args.get('technician')
        group = request.args.get('group')
        category = request.args.get('category')
        request_id = request.args.get('request_id')
        
        query = TechTimeSpent.query
        
        if technician:
            query = query.filter(TechTimeSpent.technician.ilike(f'%{technician}%'))
        if group:
            query = query.filter(TechTimeSpent.group_name.ilike(f'%{group}%'))
        if category:
            query = query.filter(TechTimeSpent.category.ilike(f'%{category}%'))
        if request_id:
            query = query.filter(TechTimeSpent.request_id == request_id)
        
        # Order by most recent first
        query = query.order_by(desc(TechTimeSpent.synced_at))
        
        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'success': True,
            'data': [item.to_dict() for item in pagination.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@time_spent_bp.route('/api/time-spent/summary', methods=['GET'])
def get_time_spent_summary():
    """
    Get summary of time spent grouped by technician.
    Query params:
        - group: Filter by group name
    """
    try:
        group_filter = request.args.get('group')
        
        query = db.session.query(
            TechTimeSpent.technician,
            TechTimeSpent.group_name,
            func.count(func.distinct(TechTimeSpent.request_id)).label('ticket_count'),
            func.count(TechTimeSpent.id).label('entry_count'),
            func.sum(TechTimeSpent.time_spent_minutes).label('total_minutes')
        ).filter(TechTimeSpent.technician.isnot(None))
        
        if group_filter:
            query = query.filter(TechTimeSpent.group_name.ilike(f'%{group_filter}%'))
        
        query = query.group_by(
            TechTimeSpent.technician,
            TechTimeSpent.group_name
        ).order_by(desc('total_minutes'))
        
        results = query.all()
        
        data = []
        for row in results:
            total_mins = row.total_minutes or 0
            data.append({
                'technician': row.technician,
                'group_name': row.group_name,
                'ticket_count': row.ticket_count,
                'entry_count': row.entry_count,
                'total_minutes': total_mins,
                'total_hours': round(total_mins / 60, 2),
                'formatted': f"{total_mins // 60}:{total_mins % 60:02d}"
            })
        
        # Calculate grand total
        grand_total_minutes = sum(d['total_minutes'] for d in data)
        
        return jsonify({
            'success': True,
            'data': data,
            'summary': {
                'total_technicians': len(data),
                'total_tickets': sum(d['ticket_count'] for d in data),
                'total_entries': sum(d['entry_count'] for d in data),
                'total_minutes': grand_total_minutes,
                'total_hours': round(grand_total_minutes / 60, 2),
                'formatted': f"{grand_total_minutes // 60}:{grand_total_minutes % 60:02d}"
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@time_spent_bp.route('/api/time-spent/by-category', methods=['GET'])
def get_time_spent_by_category():
    """Get time spent breakdown by category."""
    try:
        query = db.session.query(
            TechTimeSpent.category,
            func.count(func.distinct(TechTimeSpent.request_id)).label('ticket_count'),
            func.sum(TechTimeSpent.time_spent_minutes).label('total_minutes')
        ).filter(TechTimeSpent.category.isnot(None))
        
        query = query.group_by(TechTimeSpent.category).order_by(desc('total_minutes'))
        
        results = query.all()
        
        data = []
        for row in results:
            total_mins = row.total_minutes or 0
            data.append({
                'category': row.category,
                'ticket_count': row.ticket_count,
                'total_minutes': total_mins,
                'total_hours': round(total_mins / 60, 2),
                'formatted': f"{total_mins // 60}:{total_mins % 60:02d}"
            })
        
        return jsonify({
            'success': True,
            'data': data
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@time_spent_bp.route('/api/time-spent/by-group', methods=['GET'])
def get_time_spent_by_group():
    """Get time spent breakdown by group/queue."""
    try:
        query = db.session.query(
            TechTimeSpent.group_name,
            func.count(func.distinct(TechTimeSpent.technician)).label('technician_count'),
            func.count(func.distinct(TechTimeSpent.request_id)).label('ticket_count'),
            func.sum(TechTimeSpent.time_spent_minutes).label('total_minutes')
        ).filter(TechTimeSpent.group_name.isnot(None))
        
        query = query.group_by(TechTimeSpent.group_name).order_by(desc('total_minutes'))
        
        results = query.all()
        
        data = []
        for row in results:
            total_mins = row.total_minutes or 0
            data.append({
                'group_name': row.group_name,
                'technician_count': row.technician_count,
                'ticket_count': row.ticket_count,
                'total_minutes': total_mins,
                'total_hours': round(total_mins / 60, 2),
                'formatted': f"{total_mins // 60}:{total_mins % 60:02d}"
            })
        
        return jsonify({
            'success': True,
            'data': data
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@time_spent_bp.route('/api/time-spent/sync', methods=['POST'])
def trigger_sync():
    """Manually trigger time spent sync from ITSM database."""
    try:
        service = TimeSpentSyncService()
        result = service.sync()
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@time_spent_bp.route('/api/time-spent/stats', methods=['GET'])
def get_stats():
    """Get overall statistics for time spent data."""
    try:
        total_records = TechTimeSpent.query.count()
        total_tickets = db.session.query(
            func.count(func.distinct(TechTimeSpent.request_id))
        ).scalar() or 0
        total_technicians = db.session.query(
            func.count(func.distinct(TechTimeSpent.technician))
        ).scalar() or 0
        total_minutes = db.session.query(
            func.sum(TechTimeSpent.time_spent_minutes)
        ).scalar() or 0
        
        last_sync = db.session.query(
            func.max(TechTimeSpent.synced_at)
        ).scalar()
        
        return jsonify({
            'success': True,
            'stats': {
                'total_records': total_records,
                'total_tickets': total_tickets,
                'total_technicians': total_technicians,
                'total_minutes': total_minutes,
                'total_hours': round(total_minutes / 60, 2),
                'formatted': f"{total_minutes // 60}:{total_minutes % 60:02d}",
                'last_sync': last_sync.isoformat() if last_sync else None
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
