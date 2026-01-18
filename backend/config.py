import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    SLA_RESPONSE_MINUTES = 30
    SLA_RESOLVE_HOURS = 4
    OVERLOAD_TICKETS_PER_DAY = 15
    SECRET_KEY = os.environ.get('SECRET_KEY', 'itsm-secret-key-premium')
    
    # JWT Settings
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'itsm-jwt-super-secret-key-2026')
    JWT_EXPIRATION_HOURS = 24  # Token valid for 24 hours
    
    # Database - PostgreSQL
    # Format: postgresql://username:password@host:port/database
    # Set DATABASE_URL environment variable for production
    # Example: export DATABASE_URL="postgresql://itsm_user:password123@localhost:5432/itsm_db"
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        'postgresql://postgres:postgres@localhost:5432/itsm_report'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 10,
        'pool_recycle': 3600,
        'pool_pre_ping': True
    }
    
    # Sync settings
    SYNC_INTERVAL_SECONDS = 300 # 5 minutes
    USE_MOCK_DATA = False # Set to False to use real ManageEngine API
    
    # ManageEngine ServiceDesk Plus
    SDP_API_KEY = os.environ.get('SDP_API_KEY', 'B767E9C0-F823-4960-A104-A2D39F30C767')
    SDP_BASE_URL = os.environ.get('SDP_BASE_URL', 'https://itsm.cmcts.com.vn/api/v3')
