from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_migrate import Migrate
from models.ticket import db
from models.member import Member
from models.user import User
from models.modules import Project, ProjectMember, CustomerContact, Contact, AlarmNote, CMDBAsset
from models.alarm import AlarmNote as AlarmNoteV2, AlarmHistory
from routes.alarm_routes import alarm_bp
from services.itsm_service import ITSMService
from services.auth_service import create_access_token, login_required, leader_required
from services.sync_worker import sync_data
from config import Config
import threading

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)

# Register Blueprints
app.register_blueprint(alarm_bp)

# Initialize DB
db.init_app(app)

# Initialize Flask-Migrate
migrate = Migrate(app, db)

with app.app_context():
    db.create_all()
    # Trigger initial sync in background thread
    threading.Thread(target=sync_data, args=(app,), daemon=True).start()

itsm_service = ITSMService()

# Root welcome
@app.route('/', methods=['GET'])
def welcome():
    return jsonify({
        "message": "ITSM Report Dashboard API",
        "endpoints": {
            "summary": "/api/report/summary",
            "customers": "/api/report/customers",
            "engineers": "/api/report/engineers",
            "monitoring": "/api/report/monitoring"
        }
    })

# ==================== AUTH APIs ====================

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user"""
    data = request.get_json()
    
    # Validate required fields
    if not data.get('email') or not data.get('password') or not data.get('full_name'):
        return jsonify({'error': 'Email, password, and full_name are required'}), 400
    
    # Check if email already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 409
    
    # Create new user
    user = User(
        email=data['email'],
        full_name=data['full_name'],
        phone=data.get('phone', ''),
        role=data.get('role', 'member')  # Default to member
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    # Generate token
    token = create_access_token(user.id, user.role, user.email)
    
    return jsonify({
        'message': 'Registration successful',
        'token': token,
        'user': user.to_dict()
    }), 201


@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login and get JWT token"""
    data = request.get_json()
    
    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    if not user.is_active:
        return jsonify({'error': 'Account is deactivated'}), 403
    
    # Generate token
    token = create_access_token(user.id, user.role, user.email)
    
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': user.to_dict()
    })


@app.route('/api/auth/me', methods=['GET'])
@login_required
def get_current_user():
    """Get current authenticated user info"""
    user = User.query.get(request.current_user['user_id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict())


@app.route('/api/auth/change-password', methods=['POST'])
@login_required
def change_password():
    """Change current user's password"""
    data = request.get_json()
    
    if not data.get('current_password') or not data.get('new_password'):
        return jsonify({'error': 'Current and new password are required'}), 400
    
    user = User.query.get(request.current_user['user_id'])
    
    if not user.check_password(data['current_password']):
        return jsonify({'error': 'Current password is incorrect'}), 401
    
    user.set_password(data['new_password'])
    db.session.commit()
    
    return jsonify({'message': 'Password changed successfully'})


# ==================== USER MANAGEMENT APIs (Leader only) ====================

@app.route('/api/users', methods=['GET'])
@leader_required
def get_all_users():
    """Get all users (Leader only)"""
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify([u.to_dict() for u in users])


@app.route('/api/users/<int:user_id>', methods=['GET'])
@login_required
def get_user(user_id):
    """Get user by ID"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict())


@app.route('/api/users/<int:user_id>', methods=['PUT'])
@leader_required
def update_user(user_id):
    """Update user (Leader only)"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    user.full_name = data.get('full_name', user.full_name)
    user.phone = data.get('phone', user.phone)
    user.role = data.get('role', user.role)
    user.is_active = data.get('is_active', user.is_active)
    
    db.session.commit()
    return jsonify(user.to_dict())


@app.route('/api/users/<int:user_id>', methods=['DELETE'])
@leader_required
def delete_user(user_id):
    """Delete user (Leader only)"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Prevent deleting self
    if user.id == request.current_user['user_id']:
        return jsonify({'error': 'Cannot delete yourself'}), 400
    
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'User deleted'})

# Summary Dashboard
@app.route('/api/report/summary', methods=['GET'])
def get_summary():
    return jsonify(itsm_service.get_summary())

# Customer APIs
@app.route('/api/report/customers', methods=['GET'])
def get_customers():
    return jsonify(itsm_service.get_customers())

@app.route('/api/report/customers/<customer_id>', methods=['GET'])
def get_customer_detail(customer_id):
    detail = itsm_service.get_customer_detail(customer_id)
    if not detail:
        return jsonify({"error": "Customer not found"}), 404
    return jsonify(detail)

@app.route('/api/report/customers/<customer_id>/tickets', methods=['GET'])
def get_customer_tickets(customer_id):
    return jsonify(itsm_service.get_customer_tickets(customer_id))

# Engineer APIs
@app.route('/api/report/engineers', methods=['GET'])
def get_engineers():
    return jsonify(itsm_service.get_engineers())

@app.route('/api/report/engineers/<engineer_id>', methods=['GET'])
def get_engineer_detail(engineer_id):
    detail = itsm_service.get_engineer_detail(engineer_id)
    if not detail:
        return jsonify({"error": "Engineer not found"}), 404
    return jsonify(detail)

@app.route('/api/report/engineers/<engineer_id>/tickets', methods=['GET'])
def get_engineer_tickets(engineer_id):
    return jsonify(itsm_service.get_engineer_tickets(engineer_id))

@app.route('/api/report/tickets/<ticket_id>', methods=['GET'])
def get_ticket_detail(ticket_id):
    detail = itsm_service.get_ticket_detail(ticket_id, app)
    if not detail:
        return jsonify({"error": "Ticket not found"}), 404
    return jsonify(detail)

@app.route('/api/report/sync', methods=['POST'])
def trigger_sync():
    threading.Thread(target=sync_data, args=(app,), daemon=True).start()
    return jsonify({"message": "Sync started in background"})

@app.route('/api/report/monitoring', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "ITSM Report API (Optimized)"})

# ==================== MEMBER MANAGEMENT APIs ====================

@app.route('/api/members', methods=['GET'])
def get_all_members():
    members = Member.query.order_by(Member.created_at.desc()).all()
    return jsonify([m.to_dict() for m in members])

@app.route('/api/members/<int:member_id>', methods=['GET'])
def get_member(member_id):
    member = Member.query.get(member_id)
    if not member:
        return jsonify({"error": "Member not found"}), 404
    return jsonify(member.to_dict())

@app.route('/api/members', methods=['POST'])
def create_member():
    data = request.get_json()
    if not data.get('email') or not data.get('full_name'):
        return jsonify({"error": "Email and full_name are required"}), 400
    
    # Check duplicate email
    existing = Member.query.filter_by(email=data['email']).first()
    if existing:
        return jsonify({"error": "Email already exists"}), 409
    
    member = Member(
        email=data['email'],
        full_name=data['full_name'],
        birth_year=data.get('birth_year'),
        cccd=data.get('cccd'),
        phone=data.get('phone'),
        project=data.get('project')
    )
    db.session.add(member)
    db.session.commit()
    return jsonify(member.to_dict()), 201

@app.route('/api/members/<int:member_id>', methods=['PUT'])
def update_member(member_id):
    member = Member.query.get(member_id)
    if not member:
        return jsonify({"error": "Member not found"}), 404
    
    data = request.get_json()
    if data.get('email'):
        member.email = data['email']
    if data.get('full_name'):
        member.full_name = data['full_name']
    if 'birth_year' in data:
        member.birth_year = data['birth_year']
    if 'cccd' in data:
        member.cccd = data['cccd']
    if 'phone' in data:
        member.phone = data['phone']
    if 'project' in data:
        member.project = data['project']
    
    db.session.commit()
    return jsonify(member.to_dict())

@app.route('/api/members/<int:member_id>', methods=['DELETE'])
def delete_member(member_id):
    member = Member.query.get(member_id)
    if not member:
        return jsonify({"error": "Member not found"}), 404
    
    db.session.delete(member)
    db.session.commit()
    return jsonify({"message": "Member deleted successfully"})

@app.route('/api/members/import', methods=['POST'])
def import_members():
    """Bulk import members from JSON array"""
    data = request.get_json()
    if not isinstance(data, list):
        return jsonify({"error": "Expected array of members"}), 400
    
    imported = 0
    skipped = 0
    errors = []
    
    for item in data:
        if not item.get('email') or not item.get('full_name'):
            errors.append(f"Missing email or full_name: {item}")
            skipped += 1
            continue
        
        existing = Member.query.filter_by(email=item['email']).first()
        if existing:
            # Update existing
            existing.full_name = item['full_name']
            existing.birth_year = item.get('birth_year', existing.birth_year)
            existing.cccd = item.get('cccd', existing.cccd)
            existing.phone = item.get('phone', existing.phone)
            existing.project = item.get('project', existing.project)
            imported += 1
        else:
            # Create new
            member = Member(
                email=item['email'],
                full_name=item['full_name'],
                birth_year=item.get('birth_year'),
                cccd=item.get('cccd'),
                phone=item.get('phone'),
                project=item.get('project')
            )
            db.session.add(member)
            imported += 1
    
    db.session.commit()
    return jsonify({
        "message": f"Imported {imported} members, skipped {skipped}",
        "imported": imported,
        "skipped": skipped,
        "errors": errors
    })

# ==================== PROJECT APIs ====================

@app.route('/api/projects', methods=['GET'])
def get_all_projects():
    projects = Project.query.order_by(Project.created_at.desc()).all()
    return jsonify([p.to_dict() for p in projects])

@app.route('/api/projects/<int:project_id>', methods=['GET'])
def get_project(project_id):
    project = Project.query.get(project_id)
    if not project:
        return jsonify({"error": "Project not found"}), 404
    return jsonify(project.to_dict())

@app.route('/api/projects', methods=['POST'])
def create_project():
    data = request.get_json()
    project = Project(
        name=data.get('name'),
        description=data.get('description'),
        status=data.get('status', 'Active'),
        start_date=data.get('startDate'),
        lead_name=data.get('lead', {}).get('name'),
        lead_role=data.get('lead', {}).get('role'),
        lead_phone=data.get('lead', {}).get('phone'),
        lead_email=data.get('lead', {}).get('email')
    )
    db.session.add(project)
    db.session.commit()
    
    # Add members
    for m in data.get('members', []):
        member = ProjectMember(
            project_id=project.id,
            name=m.get('name'),
            role=m.get('role'),
            phone=m.get('phone'),
            email=m.get('email')
        )
        db.session.add(member)
    db.session.commit()
    return jsonify(project.to_dict()), 201

@app.route('/api/projects/<int:project_id>', methods=['PUT'])
def update_project(project_id):
    project = Project.query.get(project_id)
    if not project:
        return jsonify({"error": "Project not found"}), 404
    
    data = request.get_json()
    project.name = data.get('name', project.name)
    project.description = data.get('description', project.description)
    project.status = data.get('status', project.status)
    project.start_date = data.get('startDate', project.start_date)
    if 'lead' in data:
        project.lead_name = data['lead'].get('name', project.lead_name)
        project.lead_role = data['lead'].get('role', project.lead_role)
        project.lead_phone = data['lead'].get('phone', project.lead_phone)
        project.lead_email = data['lead'].get('email', project.lead_email)
    db.session.commit()
    return jsonify(project.to_dict())

@app.route('/api/projects/<int:project_id>', methods=['DELETE'])
def delete_project(project_id):
    project = Project.query.get(project_id)
    if not project:
        return jsonify({"error": "Project not found"}), 404
    db.session.delete(project)
    db.session.commit()
    return jsonify({"message": "Project deleted"})

@app.route('/api/projects/<int:project_id>/members', methods=['POST'])
def add_project_member(project_id):
    project = Project.query.get(project_id)
    if not project:
        return jsonify({"error": "Project not found"}), 404
    
    data = request.get_json()
    member = ProjectMember(
        project_id=project_id,
        name=data.get('name'),
        role=data.get('role'),
        phone=data.get('phone'),
        email=data.get('email')
    )
    db.session.add(member)
    db.session.commit()
    return jsonify(member.to_dict()), 201

@app.route('/api/projects/<int:project_id>/members/<int:member_id>', methods=['DELETE'])
def remove_project_member(project_id, member_id):
    member = ProjectMember.query.filter_by(id=member_id, project_id=project_id).first()
    if not member:
        return jsonify({"error": "Member not found"}), 404
    db.session.delete(member)
    db.session.commit()
    return jsonify({"message": "Member removed"})


# ==================== CUSTOMER CONTACT APIs ====================

@app.route('/api/customer-contacts', methods=['GET'])
def get_all_customer_contacts():
    customers = CustomerContact.query.order_by(CustomerContact.name).all()
    return jsonify([c.to_dict() for c in customers])

@app.route('/api/customer-contacts/<int:customer_id>', methods=['GET'])
def get_customer_contact(customer_id):
    customer = CustomerContact.query.get(customer_id)
    if not customer:
        return jsonify({"error": "Customer not found"}), 404
    return jsonify(customer.to_dict())

@app.route('/api/customer-contacts', methods=['POST'])
def create_customer_contact():
    data = request.get_json()
    customer = CustomerContact(
        name=data.get('name'),
        industry=data.get('industry'),
        address=data.get('address'),
        website=data.get('website'),
        status=data.get('status', 'Active'),
        it_head_name=data.get('itHead', {}).get('name'),
        it_head_title=data.get('itHead', {}).get('title'),
        it_head_phone=data.get('itHead', {}).get('phone'),
        it_head_email=data.get('itHead', {}).get('email')
    )
    db.session.add(customer)
    db.session.commit()
    
    for c in data.get('contacts', []):
        contact = Contact(
            customer_id=customer.id,
            name=c.get('name'),
            title=c.get('title'),
            department=c.get('department'),
            phone=c.get('phone'),
            email=c.get('email')
        )
        db.session.add(contact)
    db.session.commit()
    return jsonify(customer.to_dict()), 201

@app.route('/api/customer-contacts/<int:customer_id>', methods=['PUT'])
def update_customer_contact(customer_id):
    customer = CustomerContact.query.get(customer_id)
    if not customer:
        return jsonify({"error": "Customer not found"}), 404
    
    data = request.get_json()
    customer.name = data.get('name', customer.name)
    customer.industry = data.get('industry', customer.industry)
    customer.address = data.get('address', customer.address)
    customer.website = data.get('website', customer.website)
    customer.status = data.get('status', customer.status)
    if 'itHead' in data:
        customer.it_head_name = data['itHead'].get('name', customer.it_head_name)
        customer.it_head_title = data['itHead'].get('title', customer.it_head_title)
        customer.it_head_phone = data['itHead'].get('phone', customer.it_head_phone)
        customer.it_head_email = data['itHead'].get('email', customer.it_head_email)
    db.session.commit()
    return jsonify(customer.to_dict())

@app.route('/api/customer-contacts/<int:customer_id>', methods=['DELETE'])
def delete_customer_contact(customer_id):
    customer = CustomerContact.query.get(customer_id)
    if not customer:
        return jsonify({"error": "Customer not found"}), 404
    db.session.delete(customer)
    db.session.commit()
    return jsonify({"message": "Customer deleted"})

@app.route('/api/customer-contacts/<int:customer_id>/contacts', methods=['POST'])
def add_contact(customer_id):
    customer = CustomerContact.query.get(customer_id)
    if not customer:
        return jsonify({"error": "Customer not found"}), 404
    
    data = request.get_json()
    contact = Contact(
        customer_id=customer_id,
        name=data.get('name'),
        title=data.get('title'),
        department=data.get('department'),
        phone=data.get('phone'),
        email=data.get('email')
    )
    db.session.add(contact)
    db.session.commit()
    return jsonify(contact.to_dict()), 201

@app.route('/api/customer-contacts/<int:customer_id>/contacts/<int:contact_id>', methods=['DELETE'])
def remove_contact(customer_id, contact_id):
    contact = Contact.query.filter_by(id=contact_id, customer_id=customer_id).first()
    if not contact:
        return jsonify({"error": "Contact not found"}), 404
    db.session.delete(contact)
    db.session.commit()
    return jsonify({"message": "Contact removed"})


# ==================== ALARM NOTES APIs ====================

@app.route('/api/alarms', methods=['GET'])
def get_all_alarms():
    alarms = AlarmNote.query.order_by(AlarmNote.updated_at.desc()).all()
    return jsonify([a.to_dict() for a in alarms])

@app.route('/api/alarms/<int:alarm_id>', methods=['GET'])
def get_alarm(alarm_id):
    alarm = AlarmNote.query.get(alarm_id)
    if not alarm:
        return jsonify({"error": "Alarm not found"}), 404
    return jsonify(alarm.to_dict())

@app.route('/api/alarms', methods=['POST'])
def create_alarm():
    data = request.get_json()
    # Generate alarm_id
    count = AlarmNote.query.count() + 1
    alarm_id = f"ALM-{str(count).zfill(3)}"
    
    alarm = AlarmNote(
        alarm_id=alarm_id,
        alarm_name=data.get('alarmName'),
        severity=data.get('severity', 'Warning'),
        target=data.get('target'),
        status=data.get('status', 'Open'),
        ticket_id=data.get('ticketId'),
        note=data.get('note')
    )
    db.session.add(alarm)
    db.session.commit()
    return jsonify(alarm.to_dict()), 201

@app.route('/api/alarms/<string:alarm_id>', methods=['PUT'])
def update_alarm(alarm_id):
    alarm = AlarmNote.query.filter_by(alarm_id=alarm_id).first()
    if not alarm:
        return jsonify({"error": "Alarm not found"}), 404
    
    data = request.get_json()
    alarm.alarm_name = data.get('alarmName', alarm.alarm_name)
    alarm.severity = data.get('severity', alarm.severity)
    alarm.target = data.get('target', alarm.target)
    alarm.status = data.get('status', alarm.status)
    alarm.ticket_id = data.get('ticketId', alarm.ticket_id)
    alarm.note = data.get('note', alarm.note)
    db.session.commit()
    return jsonify(alarm.to_dict())

@app.route('/api/alarms/<string:alarm_id>', methods=['DELETE'])
def delete_alarm(alarm_id):
    alarm = AlarmNote.query.filter_by(alarm_id=alarm_id).first()
    if not alarm:
        return jsonify({"error": "Alarm not found"}), 404
    db.session.delete(alarm)
    db.session.commit()
    return jsonify({"message": "Alarm deleted"})


# ==================== CMDB ASSET APIs ====================

@app.route('/api/cmdb', methods=['GET'])
def get_all_assets():
    assets = CMDBAsset.query.order_by(CMDBAsset.created_at.desc()).all()
    return jsonify([a.to_dict() for a in assets])

@app.route('/api/cmdb/<string:asset_id>', methods=['GET'])
def get_asset(asset_id):
    asset = CMDBAsset.query.filter_by(asset_id=asset_id).first()
    if not asset:
        return jsonify({"error": "Asset not found"}), 404
    return jsonify(asset.to_dict())

@app.route('/api/cmdb', methods=['POST'])
def create_asset():
    data = request.get_json()
    asset_type = data.get('type', 'VM')
    prefix = 'VC' if asset_type == 'vCenter' else 'HOST' if asset_type == 'Host' else 'VM'
    count = CMDBAsset.query.filter_by(asset_type=asset_type).count() + 1
    asset_id = f"{prefix}-{str(count).zfill(3)}"
    
    asset = CMDBAsset(
        asset_id=asset_id,
        asset_type=asset_type,
        name=data.get('name'),
        ip=data.get('ip'),
        os=data.get('os'),
        cluster=data.get('cluster'),
        status=data.get('status', 'Running'),
        cpu=data.get('cpu'),
        ram=data.get('ram'),
        admin_name=data.get('adminName'),
        admin_phone=data.get('adminPhone'),
        note=data.get('note')
    )
    db.session.add(asset)
    db.session.commit()
    return jsonify(asset.to_dict()), 201

@app.route('/api/cmdb/<string:asset_id>', methods=['PUT'])
def update_asset(asset_id):
    asset = CMDBAsset.query.filter_by(asset_id=asset_id).first()
    if not asset:
        return jsonify({"error": "Asset not found"}), 404
    
    data = request.get_json()
    asset.name = data.get('name', asset.name)
    asset.ip = data.get('ip', asset.ip)
    asset.os = data.get('os', asset.os)
    asset.cluster = data.get('cluster', asset.cluster)
    asset.status = data.get('status', asset.status)
    asset.cpu = data.get('cpu', asset.cpu)
    asset.ram = data.get('ram', asset.ram)
    asset.admin_name = data.get('adminName', asset.admin_name)
    asset.admin_phone = data.get('adminPhone', asset.admin_phone)
    asset.note = data.get('note', asset.note)
    db.session.commit()
    return jsonify(asset.to_dict())

@app.route('/api/cmdb/<string:asset_id>', methods=['DELETE'])
def delete_asset(asset_id):
    asset = CMDBAsset.query.filter_by(asset_id=asset_id).first()
    if not asset:
        return jsonify({"error": "Asset not found"}), 404
    db.session.delete(asset)
    db.session.commit()
    return jsonify({"message": "Asset deleted"})


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
