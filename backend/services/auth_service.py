import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, current_app

def create_access_token(user_id, role, email):
    """Create a JWT access token"""
    payload = {
        'user_id': user_id,
        'role': role,
        'email': email,
        'exp': datetime.utcnow() + timedelta(hours=current_app.config.get('JWT_EXPIRATION_HOURS', 24)),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')


def decode_token(token):
    """Decode and validate a JWT token"""
    try:
        payload = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None  # Token expired
    except jwt.InvalidTokenError:
        return None  # Invalid token


def get_token_from_header():
    """Extract token from Authorization header"""
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        return auth_header[7:]  # Remove 'Bearer ' prefix
    return None


def login_required(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_from_header()
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        payload = decode_token(token)
        if not payload:
            return jsonify({'error': 'Token is invalid or expired'}), 401
        
        # Add user info to request context
        request.current_user = {
            'user_id': payload['user_id'],
            'role': payload['role'],
            'email': payload['email']
        }
        
        return f(*args, **kwargs)
    return decorated


def leader_required(f):
    """Decorator to require leader role"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_from_header()
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        payload = decode_token(token)
        if not payload:
            return jsonify({'error': 'Token is invalid or expired'}), 401
        
        if payload.get('role') != 'leader':
            return jsonify({'error': 'Leader access required'}), 403
        
        request.current_user = {
            'user_id': payload['user_id'],
            'role': payload['role'],
            'email': payload['email']
        }
        
        return f(*args, **kwargs)
    return decorated


def role_required(*allowed_roles):
    """Decorator to require specific roles"""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = get_token_from_header()
            
            if not token:
                return jsonify({'error': 'Token is missing'}), 401
            
            payload = decode_token(token)
            if not payload:
                return jsonify({'error': 'Token is invalid or expired'}), 401
            
            if payload.get('role') not in allowed_roles:
                return jsonify({'error': f'Access denied. Required roles: {", ".join(allowed_roles)}'}), 403
            
            request.current_user = {
                'user_id': payload['user_id'],
                'role': payload['role'],
                'email': payload['email']
            }
            
            return f(*args, **kwargs)
        return decorated
    return decorator
