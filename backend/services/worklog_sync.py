import logging
import os
import urllib.parse
from datetime import datetime
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from flask import current_app
from models.ticket import db
from models.worklog import Worklog

# Configure logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

class WorklogSyncService:
    def __init__(self):
        self.remote_db_url = os.environ.get('ITSM_DB_URL')
        # If DB URL is not provided, try to construct from components
        if not self.remote_db_url:
            self.remote_db_url = self._construct_db_url()
            
        self.engine = None
        if self.remote_db_url:
            self.engine = create_engine(
                self.remote_db_url,
                pool_size=10,
                pool_recycle=3600,
                pool_pre_ping=True
            )

    def _construct_db_url(self):
        """Construct connection string from individual env vars if URL not set"""
        driver = os.environ.get('ITSM_DB_DRIVER', 'mssql+pyodbc')
        server = os.environ.get('ITSM_DB_SERVER')
        database = os.environ.get('ITSM_DB_NAME')
        user = os.environ.get('ITSM_DB_USER')
        password = os.environ.get('ITSM_DB_PASSWORD')
        
        if not all([server, database, user, password]):
            return None
            
        # Encode password to handle special characters
        params = urllib.parse.quote_plus(
            f"DRIVER={{ODBC Driver 17 for SQL Server}};"
            f"SERVER={server};"
            f"DATABASE={database};"
            f"UID={user};"
            f"PWD={password}"
        )
        return f"{driver}/?odbc_connect={params}"

    def get_last_synced_id(self):
        """Get the ID of the last synced remote worklog from local DB"""
        try:
            # We assume remote_worklog_id increases monotonically
            last_log = Worklog.query.order_by(Worklog.remote_worklog_id.desc()).first()
            return last_log.remote_worklog_id if last_log else 0
        except Exception as e:
            logger.error(f"Error getting last synced ID: {e}")
            return 0

    def fetch_new_worklogs(self, last_id):
        """Fetch worklogs from remote DB with ID greater than last_id"""
        if not self.engine:
            logger.error("Remote DB not configured.")
            return []

        # Example Query - ADJUST TABLE/COLUMN NAMES BASED ON ACTUAL DB SCHEMA
        # We fetch: id, ticket_id, technician, time_spent, description, updated_at
        query = text("""
            SELECT 
                w.worklogid, 
                w.requestid, 
                u.first_name + ' ' + u.last_name as technician_name, 
                w.timespent, 
                w.description, 
                w.createdtime 
            FROM WorkLog w
            LEFT JOIN AaaUser u ON w.userid = u.user_id
            WHERE w.worklogid > :last_id
            ORDER BY w.worklogid ASC
            OFFSET 0 ROWS FETCH NEXT 100 ROWS ONLY
        """)

        try:
            with self.engine.connect() as conn:
                result = conn.execute(query, {"last_id": last_id})
                return result.fetchall()
        except SQLAlchemyError as e:
            logger.error(f"Error executing remote query: {e}")
            return []

    def process_time_spent(self, raw_time):
        """
        Convert raw time to seconds.
        Assumed Source: Milliseconds (common in ManageEngine)
        Target: Seconds
        """
        if not raw_time:
            return 0
        try:
            # Convert milliseconds to seconds
            # Adjust this logic if source is minutes or different unit
            return int(raw_time) // 1000
        except (ValueError, TypeError):
            logger.warning(f"Invalid time format: {raw_time}")
            return 0

    def sync(self):
        """Main sync logic"""
        logger.info("Starting Worklog Sync...")
        
        if not self.engine:
            logger.warning("Remote database engine not initialized. Skipping sync.")
            return {"success": False, "message": "DB Configuration missing"}

        synced_count = 0
        try:
            last_id = self.get_last_synced_id()
            logger.info(f"Fetching worklogs after remote ID: {last_id}")

            rows = self.fetch_new_worklogs(last_id)
            if not rows:
                logger.info("No new worklogs found.")
                return {"success": True, "count": 0}

            for row in rows:
                # Map remote columns to local model
                # row keys depend on the query columns
                
                # Check for existing to be safe (though we use > last_id)
                # But parallel runs could cause issues, unlikely here but good practice
                exists = Worklog.query.filter_by(remote_worklog_id=row.worklogid).first()
                if exists:
                    continue

                # Handle timestamp
                # Assuming remote is Unix timestamp in ms or datetime object
                remote_created = row.createdtime
                if isinstance(remote_created, int):
                    remote_created_dt = datetime.fromtimestamp(remote_created / 1000.0)
                else:
                    remote_created_dt = remote_created

                new_log = Worklog(
                    ticket_id=str(row.requestid),
                    technician_name=row.technician_name,
                    time_spent_seconds=self.process_time_spent(row.timespent),
                    description=row.description,
                    remote_worklog_id=row.worklogid,
                    remote_updated_at=remote_created_dt
                )
                db.session.add(new_log)
                synced_count += 1

            db.session.commit()
            logger.info(f"Successfully synced {synced_count} worklogs.")
            return {"success": True, "count": synced_count}

        except Exception as e:
            db.session.rollback()
            logger.error(f"Sync failed: {e}")
            return {"success": False, "error": str(e)}

# Helper function to easy integration
def run_worklog_sync(app=None):
    if app:
        with app.app_context():
            service = WorklogSyncService()
            return service.sync()
    else:
        # Fallback if called within an existing context
        service = WorklogSyncService()
        return service.sync()
