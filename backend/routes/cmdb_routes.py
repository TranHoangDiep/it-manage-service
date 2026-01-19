from flask import Blueprint, jsonify, request
from datetime import datetime
from database import db
from models.cmdb import CI, CIRelationship, Location, Service, SLA, Alarm

cmdb_bp = Blueprint('cmdb', __name__, url_prefix='/api/cmdb')

# ==================== CI (Assets) ====================

@cmdb_bp.route('/assets', methods=['GET'])
def get_assets():
    """Get all CIs with optional filtering"""
    ci_type = request.args.get('type')
    category = request.args.get('category')
    customer_id = request.args.get('customer_id')
    status = request.args.get('status')
    
    query = CI.query
    
    if ci_type:
        query = query.filter(CI.type == ci_type)
    if category:
        query = query.filter(CI.category == category)
    if customer_id:
        query = query.filter(CI.customer_id == customer_id)
    if status:
        query = query.filter(CI.status == status)
    
    cis = query.order_by(CI.name).all()
    
    return jsonify({
        'success': True,
        'count': len(cis),
        'data': [ci.to_dict() for ci in cis]
    })


@cmdb_bp.route('/assets/<ci_id>', methods=['GET'])
def get_asset(ci_id):
    """Get single CI with relationships"""
    ci = CI.query.get(ci_id)
    if not ci:
        return jsonify({'success': False, 'error': 'CI not found'}), 404
    
    # Get relationships
    outgoing = [{'id': r.target_ci_id, 'type': r.relationship_type, 'name': r.target_ci.name} 
                for r in ci.outgoing_relationships]
    incoming = [{'id': r.source_ci_id, 'type': r.relationship_type, 'name': r.source_ci.name} 
                for r in ci.incoming_relationships]
    
    data = ci.to_dict()
    data['relationships'] = {'outgoing': outgoing, 'incoming': incoming}
    
    return jsonify({'success': True, 'data': data})


@cmdb_bp.route('/assets', methods=['POST'])
def create_asset():
    """Create new CI"""
    data = request.get_json()
    
    ci = CI(
        id=data.get('id') or f"CI-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        name=data['name'],
        type=data['type'],
        category=data.get('category'),
        ip_address=data.get('ip_address'),
        hostname=data.get('hostname'),
        os_type=data.get('os_type'),
        model=data.get('model'),
        customer_id=data.get('customer_id'),
        customer_name=data.get('customer_name'),
        admin_name=data.get('admin_name'),
        admin_phone=data.get('admin_phone'),
        status=data.get('status', 'Active'),
        specs=data.get('specs', {}),
        notes=data.get('notes'),
    )
    
    db.session.add(ci)
    db.session.commit()
    
    return jsonify({'success': True, 'data': ci.to_dict()}), 201


@cmdb_bp.route('/assets/<ci_id>', methods=['PUT'])
def update_asset(ci_id):
    """Update CI"""
    ci = CI.query.get(ci_id)
    if not ci:
        return jsonify({'success': False, 'error': 'CI not found'}), 404
    
    data = request.get_json()
    
    for field in ['name', 'type', 'category', 'ip_address', 'hostname', 'os_type', 
                  'model', 'customer_id', 'customer_name', 'admin_name', 'admin_phone',
                  'status', 'lifecycle_stage', 'specs', 'notes', 'tags']:
        if field in data:
            setattr(ci, field, data[field])
    
    db.session.commit()
    
    return jsonify({'success': True, 'data': ci.to_dict()})


@cmdb_bp.route('/assets/<ci_id>', methods=['DELETE'])
def delete_asset(ci_id):
    """Delete CI"""
    ci = CI.query.get(ci_id)
    if not ci:
        return jsonify({'success': False, 'error': 'CI not found'}), 404
    
    db.session.delete(ci)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'CI deleted'})


# ==================== Relationships ====================

@cmdb_bp.route('/relationships', methods=['GET'])
def get_relationships():
    """Get all CI relationships"""
    relationships = CIRelationship.query.all()
    
    return jsonify({
        'success': True,
        'count': len(relationships),
        'data': [{
            'id': r.id,
            'source': {'id': r.source_ci_id, 'name': r.source_ci.name if r.source_ci else None},
            'target': {'id': r.target_ci_id, 'name': r.target_ci.name if r.target_ci else None},
            'type': r.relationship_type,
            'direction': r.direction,
        } for r in relationships]
    })


@cmdb_bp.route('/relationships', methods=['POST'])
def create_relationship():
    """Create CI relationship"""
    data = request.get_json()
    
    rel = CIRelationship(
        source_ci_id=data['source_ci_id'],
        target_ci_id=data['target_ci_id'],
        relationship_type=data['relationship_type'],
        direction=data.get('direction', 'forward'),
        description=data.get('description'),
    )
    
    db.session.add(rel)
    db.session.commit()
    
    return jsonify({'success': True, 'id': rel.id}), 201


# ==================== Locations ====================

@cmdb_bp.route('/locations', methods=['GET'])
def get_locations():
    """Get all locations"""
    locations = Location.query.all()
    
    return jsonify({
        'success': True,
        'data': [{
            'id': loc.id,
            'name': loc.name,
            'type': loc.type,
            'parent_id': loc.parent_id,
            'address': loc.address,
            'city': loc.city,
            'ci_count': len(loc.cis),
        } for loc in locations]
    })


# ==================== Services ====================

@cmdb_bp.route('/services', methods=['GET'])
def get_services():
    """Get all services in catalog"""
    services = Service.query.filter_by(status='Active').all()
    
    return jsonify({
        'success': True,
        'data': [{
            'id': s.id,
            'name': s.name,
            'description': s.description,
            'category': s.category,
            'type': s.type,
            'status': s.status,
        } for s in services]
    })


# ==================== SLAs ====================

@cmdb_bp.route('/slas', methods=['GET'])
def get_slas():
    """Get all SLA definitions"""
    slas = SLA.query.all()
    
    return jsonify({
        'success': True,
        'data': [{
            'id': s.id,
            'name': s.name,
            'response': {
                'critical': s.response_critical,
                'high': s.response_high,
                'medium': s.response_medium,
                'low': s.response_low,
            },
            'resolution': {
                'critical': s.resolution_critical,
                'high': s.resolution_high,
                'medium': s.resolution_medium,
                'low': s.resolution_low,
            },
            'uptime_target': s.uptime_target,
            'support_hours': s.support_hours,
        } for s in slas]
    })


# ==================== Statistics ====================

@cmdb_bp.route('/stats', methods=['GET'])
def get_cmdb_stats():
    """Get CMDB statistics"""
    total_cis = CI.query.count()
    by_type = db.session.query(CI.type, db.func.count(CI.id)).group_by(CI.type).all()
    by_status = db.session.query(CI.status, db.func.count(CI.id)).group_by(CI.status).all()
    by_customer = db.session.query(CI.customer_name, db.func.count(CI.id)).group_by(CI.customer_name).limit(10).all()
    
    return jsonify({
        'success': True,
        'data': {
            'total': total_cis,
            'by_type': dict(by_type),
            'by_status': dict(by_status),
            'by_customer': dict(by_customer),
        }
    })
