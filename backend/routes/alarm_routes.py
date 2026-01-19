"""
Alarm Routes - Alertmanager webhook and Alarm Notes API
"""
from flask import Blueprint, jsonify, request
from datetime import datetime
from models.ticket import db
from models.alarm import AlarmNote, AlarmHistory

alarm_bp = Blueprint('alarm', __name__, url_prefix='/api')


def generate_alarm_id():
    """Generate sequential alarm ID like ALM-001"""
    count = AlarmNote.query.count() + 1
    return f"ALM-{str(count).zfill(4)}"


def add_history(alarm_id, action, old_value=None, new_value=None, changed_by='system', comment=None):
    """Add audit history entry"""
    history = AlarmHistory(
        alarm_id=alarm_id,
        action=action,
        old_value=old_value,
        new_value=new_value,
        changed_by=changed_by,
        comment=comment
    )
    db.session.add(history)


# ==================== ALERTMANAGER WEBHOOK ====================

@alarm_bp.route('/webhooks/alertmanager', methods=['POST'])
def alertmanager_webhook():
    """
    Receive alerts from Alertmanager.
    Only CRITICAL alerts are auto-created as Alarm Notes.
    Warning alerts are ignored (monitored via Grafana only).
    """
    data = request.get_json()
    
    if not data or 'alerts' not in data:
        return jsonify({'error': 'Invalid payload'}), 400
    
    created = 0
    updated = 0
    skipped = 0
    
    for alert in data.get('alerts', []):
        labels = alert.get('labels', {})
        annotations = alert.get('annotations', {})
        severity = labels.get('severity', 'warning').lower()
        
        # CRITICAL ONLY - auto-create
        if severity != 'critical':
            skipped += 1
            continue
        
        fingerprint = alert.get('fingerprint')
        status = alert.get('status', 'firing')
        
        # Check for existing alarm by fingerprint
        existing = AlarmNote.query.filter_by(external_id=fingerprint).first()
        
        if status == 'firing':
            if existing:
                # Update occurrence count
                existing.occurrence_count += 1
                existing.last_occurrence = datetime.utcnow()
                
                # Reopen if was resolved
                if existing.status == 'resolved':
                    existing.status = 'open'
                    add_history(existing.alarm_id, 'reopened', 'resolved', 'open', 'alertmanager')
                
                updated += 1
            else:
                # Create new alarm note
                alarm_id = generate_alarm_id()
                fired_at = None
                if alert.get('startsAt'):
                    try:
                        fired_at = datetime.fromisoformat(alert['startsAt'].replace('Z', '+00:00'))
                    except:
                        fired_at = datetime.utcnow()
                
                alarm = AlarmNote(
                    alarm_id=alarm_id,
                    source='alertmanager',
                    external_id=fingerprint,
                    alertname=labels.get('alertname', 'Unknown'),
                    severity='critical',
                    target=labels.get('instance', labels.get('host', '')),
                    instance=labels.get('instance'),
                    job=labels.get('job'),
                    labels=labels,
                    annotations=annotations,
                    status='open',
                    fired_at=fired_at,
                    note=annotations.get('description', annotations.get('summary', '')),
                    created_by='alertmanager',
                    last_occurrence=datetime.utcnow()
                )
                db.session.add(alarm)
                add_history(alarm_id, 'created', None, 'open', 'alertmanager', f"Auto-created from {labels.get('alertname')}")
                created += 1
                
        elif status == 'resolved':
            if existing and existing.status != 'resolved':
                old_status = existing.status
                existing.status = 'resolved'
                existing.resolved_at = datetime.utcnow()
                add_history(existing.alarm_id, 'resolved', old_status, 'resolved', 'alertmanager', 'Auto-resolved by Alertmanager')
                updated += 1
    
    db.session.commit()
    
    return jsonify({
        'status': 'ok',
        'created': created,
        'updated': updated,
        'skipped': skipped
    })


# ==================== ALARM NOTES CRUD ====================

@alarm_bp.route('/alarms', methods=['GET'])
def get_alarms():
    """Get all alarms with optional filters"""
    status = request.args.get('status')
    severity = request.args.get('severity')
    source = request.args.get('source')
    customer_id = request.args.get('customer_id')
    
    query = AlarmNote.query
    
    if status:
        query = query.filter(AlarmNote.status == status)
    if severity:
        query = query.filter(AlarmNote.severity == severity)
    if source:
        query = query.filter(AlarmNote.source == source)
    if customer_id:
        query = query.filter(AlarmNote.customer_id == customer_id)
    
    alarms = query.order_by(AlarmNote.created_at.desc()).all()
    
    return jsonify({
        'count': len(alarms),
        'data': [a.to_dict() for a in alarms]
    })


@alarm_bp.route('/alarms/<alarm_id>', methods=['GET'])
def get_alarm(alarm_id):
    """Get single alarm detail"""
    alarm = AlarmNote.query.filter_by(alarm_id=alarm_id).first()
    if not alarm:
        return jsonify({'error': 'Alarm not found'}), 404
    return jsonify(alarm.to_dict())


@alarm_bp.route('/alarms', methods=['POST'])
def create_alarm():
    """Create manual alarm note (typically for Warning alerts)"""
    data = request.get_json()
    
    if not data.get('alertname'):
        return jsonify({'error': 'alertname is required'}), 400
    
    alarm_id = generate_alarm_id()
    
    alarm = AlarmNote(
        alarm_id=alarm_id,
        source='manual',
        alertname=data['alertname'],
        severity=data.get('severity', 'warning'),
        target=data.get('target'),
        instance=data.get('instance'),
        ci_id=data.get('ci_id'),
        customer_id=data.get('customer_id'),
        customer_name=data.get('customer_name'),
        status='open',
        note=data.get('note'),
        assigned_to=data.get('assigned_to'),
        created_by=data.get('created_by', 'user'),
        fired_at=datetime.utcnow()
    )
    
    db.session.add(alarm)
    add_history(alarm_id, 'created', None, 'open', data.get('created_by', 'user'), 'Manual alarm note created')
    db.session.commit()
    
    return jsonify(alarm.to_dict()), 201


@alarm_bp.route('/alarms/<alarm_id>', methods=['PUT'])
def update_alarm(alarm_id):
    """Update alarm note"""
    alarm = AlarmNote.query.filter_by(alarm_id=alarm_id).first()
    if not alarm:
        return jsonify({'error': 'Alarm not found'}), 404
    
    data = request.get_json()
    changed_by = data.get('changed_by', 'user')
    
    # Track status change
    if 'status' in data and data['status'] != alarm.status:
        old_status = alarm.status
        alarm.status = data['status']
        
        if data['status'] == 'in_progress' and not alarm.acknowledged_at:
            alarm.acknowledged_at = datetime.utcnow()
        elif data['status'] == 'resolved':
            alarm.resolved_at = datetime.utcnow()
        
        add_history(alarm_id, 'status_changed', old_status, data['status'], changed_by)
    
    # Update other fields
    for field in ['note', 'root_cause', 'resolution', 'assigned_to', 'ticket_id', 'ticket_url', 'ci_id', 'customer_id']:
        if field in data:
            setattr(alarm, field, data[field])
    
    db.session.commit()
    return jsonify(alarm.to_dict())


@alarm_bp.route('/alarms/<alarm_id>/acknowledge', methods=['PUT'])
def acknowledge_alarm(alarm_id):
    """Set alarm status to in_progress"""
    alarm = AlarmNote.query.filter_by(alarm_id=alarm_id).first()
    if not alarm:
        return jsonify({'error': 'Alarm not found'}), 404
    
    data = request.get_json() or {}
    old_status = alarm.status
    alarm.status = 'in_progress'
    alarm.acknowledged_at = datetime.utcnow()
    alarm.assigned_to = data.get('assigned_to', alarm.assigned_to)
    
    add_history(alarm_id, 'acknowledged', old_status, 'in_progress', data.get('changed_by', 'user'))
    db.session.commit()
    
    return jsonify(alarm.to_dict())


@alarm_bp.route('/alarms/<alarm_id>/resolve', methods=['PUT'])
def resolve_alarm(alarm_id):
    """Set alarm status to resolved"""
    alarm = AlarmNote.query.filter_by(alarm_id=alarm_id).first()
    if not alarm:
        return jsonify({'error': 'Alarm not found'}), 404
    
    data = request.get_json() or {}
    old_status = alarm.status
    alarm.status = 'resolved'
    alarm.resolved_at = datetime.utcnow()
    alarm.resolution = data.get('resolution', alarm.resolution)
    alarm.root_cause = data.get('root_cause', alarm.root_cause)
    
    add_history(alarm_id, 'resolved', old_status, 'resolved', data.get('changed_by', 'user'), data.get('resolution'))
    db.session.commit()
    
    return jsonify(alarm.to_dict())


@alarm_bp.route('/alarms/<alarm_id>/link-ticket', methods=['POST'])
def link_ticket(alarm_id):
    """Link alarm to ITSM ticket"""
    alarm = AlarmNote.query.filter_by(alarm_id=alarm_id).first()
    if not alarm:
        return jsonify({'error': 'Alarm not found'}), 404
    
    data = request.get_json()
    alarm.ticket_id = data.get('ticket_id')
    alarm.ticket_url = data.get('ticket_url')
    
    add_history(alarm_id, 'ticket_linked', None, data.get('ticket_id'), data.get('changed_by', 'user'))
    db.session.commit()
    
    return jsonify(alarm.to_dict())


@alarm_bp.route('/alarms/<alarm_id>/history', methods=['GET'])
def get_alarm_history(alarm_id):
    """Get audit history for an alarm"""
    history = AlarmHistory.query.filter_by(alarm_id=alarm_id).order_by(AlarmHistory.changed_at.desc()).all()
    return jsonify([h.to_dict() for h in history])


@alarm_bp.route('/alarms/<alarm_id>', methods=['DELETE'])
def delete_alarm(alarm_id):
    """Delete alarm note"""
    alarm = AlarmNote.query.filter_by(alarm_id=alarm_id).first()
    if not alarm:
        return jsonify({'error': 'Alarm not found'}), 404
    
    # Also delete history
    AlarmHistory.query.filter_by(alarm_id=alarm_id).delete()
    db.session.delete(alarm)
    db.session.commit()
    
    return jsonify({'message': 'Alarm deleted'})


# ==================== STATISTICS ====================

@alarm_bp.route('/alarms/stats', methods=['GET'])
def get_alarm_stats():
    """Get alarm statistics"""
    total = AlarmNote.query.count()
    by_status = db.session.query(AlarmNote.status, db.func.count(AlarmNote.id)).group_by(AlarmNote.status).all()
    by_severity = db.session.query(AlarmNote.severity, db.func.count(AlarmNote.id)).group_by(AlarmNote.severity).all()
    by_source = db.session.query(AlarmNote.source, db.func.count(AlarmNote.id)).group_by(AlarmNote.source).all()
    
    return jsonify({
        'total': total,
        'by_status': dict(by_status),
        'by_severity': dict(by_severity),
        'by_source': dict(by_source)
    })
