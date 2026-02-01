"""
Time Spent Sync Service
Fetches time spent data from ManageEngine WO_TECH_INFO table and stores locally.
"""
import logging
import os
import urllib.parse
from datetime import datetime
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.dialects.postgresql import insert as pg_insert
from models.ticket import db
from models.time_spent import TechTimeSpent

logger = logging.getLogger(__name__)


class TimeSpentSyncService:
    """
    Service to sync time spent data from ManageEngine ITSM database.
    Uses the WO_TECH_INFO table which contains accurate work time logs.
    """
    
    def __init__(self):
        self.db_url = os.environ.get('ITSM_DB_URL')
        if not self.db_url:
            self.db_url = self._construct_db_url()
        
        self.engine = None
        if self.db_url:
            try:
                self.engine = create_engine(
                    self.db_url,
                    pool_size=5,
                    pool_recycle=3600,
                    pool_pre_ping=True
                )
                logger.info("ITSM Database Engine initialized for TimeSpent sync.")
            except Exception as e:
                logger.error(f"Failed to create engine: {e}")
    
    def _construct_db_url(self):
        """Construct SQLAlchemy connection URL for MSSQL."""
        server = os.environ.get('SDP_DB_HOST')
        database = os.environ.get('SDP_DB_NAME')
        user = os.environ.get('SDP_DB_USER')
        password = os.environ.get('SDP_DB_PASS')
        port = os.environ.get('SDP_DB_PORT', '1433')
        driver = os.environ.get('SDP_DB_DRIVER', 'mssql+pyodbc')
        
        if not all([server, database, user, password]):
            logger.warning("Missing SDP_DB_ environment variables.")
            return None
        
        params = urllib.parse.quote_plus(
            f"DRIVER={{ODBC Driver 17 for SQL Server}};"
            f"SERVER={server},{port};"
            f"DATABASE={database};"
            f"UID={user};"
            f"PWD={password}"
        )
        return f"{driver}:///?odbc_connect={params}"
    
    def fetch_time_spent_data(self, limit=5000):
        """
        Fetch time spent data from WO_TECH_INFO table.
        Uses the user's provided query structure.
        """
        if not self.engine:
            logger.error("ITSM Database not configured.")
            return []
        
        query = text(f"""
            SELECT TOP {limit}
                wti.ASSESSMENTID AS assessment_id,
                wo.WORKORDERID AS request_id,
                wo.TITLE AS subject,
                cd.CATEGORYNAME AS category,
                scd.NAME AS subcategory,
                icd.NAME AS item,
                ti.FIRST_NAME AS technician,
                qd.QUEUENAME AS group_name,
                ti1.FIRST_NAME AS from_technician,
                ti2.FIRST_NAME AS to_technician,
                TRY_CAST(wti.timespent AS INT) AS time_spent_minutes
            FROM WorkOrder wo
            LEFT JOIN WorkOrderStates wos ON wo.WORKORDERID = wos.WORKORDERID
            LEFT JOIN ItemDefinition icd ON wos.ITEMID = icd.ITEMID
            LEFT JOIN SubCategoryDefinition scd ON wos.SUBCATEGORYID = scd.SUBCATEGORYID
            LEFT JOIN CategoryDefinition cd ON wos.CATEGORYID = cd.CATEGORYID
            LEFT JOIN SDUser td ON wos.OWNERID = td.USERID
            LEFT JOIN AaaUser ti ON td.USERID = ti.USER_ID
            LEFT JOIN WorkOrder_Queue woq ON wo.WORKORDERID = woq.WORKORDERID
            LEFT JOIN QueueDefinition qd ON woq.QUEUEID = qd.QUEUEID
            LEFT JOIN wo_assessment woa ON wo.WORKORDERID = woa.WORKORDERID
            INNER JOIN WO_TECH_INFO wti ON woa.ASSESSMENTID = wti.ASSESSMENTID
            LEFT JOIN AaaUser ti1 ON wti.TECHNICIANID = ti1.USER_ID
            LEFT JOIN AaaUser ti2 ON wti.NEXTTECHNICIANID = ti2.USER_ID
            WHERE wti.timespent IS NOT NULL AND TRY_CAST(wti.timespent AS INT) > 0
            ORDER BY wo.WORKORDERID DESC
        """)
        
        try:
            with self.engine.connect() as conn:
                result = conn.execute(query)
                return [dict(row._mapping) for row in result.fetchall()]
        except SQLAlchemyError as e:
            logger.error(f"Database query error: {e}")
            return []
    
    def sync(self):
        """
        Main sync method - fetches from ITSM and upserts to local DB.
        """
        logger.info("Starting Time Spent sync...")
        
        if not self.engine:
            return {'success': False, 'error': 'ITSM Database not configured'}
        
        try:
            records = self.fetch_time_spent_data()
            
            if not records:
                logger.info("No time spent records found.")
                return {'success': True, 'synced': 0}
            
            synced_count = 0
            error_count = 0
            
            for record in records:
                try:
                    assessment_id = str(record.get('assessment_id'))
                    
                    # Skip if no assessment_id
                    if not assessment_id:
                        continue
                    
                    data = {
                        'assessment_id': assessment_id,
                        'request_id': str(record.get('request_id', '')),
                        'subject': (record.get('subject') or '')[:500],
                        'category': record.get('category'),
                        'subcategory': record.get('subcategory'),
                        'item': record.get('item'),
                        'technician': record.get('technician'),
                        'group_name': record.get('group_name'),
                        'from_technician': record.get('from_technician'),
                        'to_technician': record.get('to_technician'),
                        'time_spent_minutes': record.get('time_spent_minutes') or 0,
                        'synced_at': datetime.utcnow()
                    }
                    
                    # Upsert using PostgreSQL ON CONFLICT
                    stmt = pg_insert(TechTimeSpent).values(data)
                    stmt = stmt.on_conflict_do_update(
                        index_elements=['assessment_id'],
                        set_={
                            'request_id': stmt.excluded.request_id,
                            'subject': stmt.excluded.subject,
                            'category': stmt.excluded.category,
                            'subcategory': stmt.excluded.subcategory,
                            'item': stmt.excluded.item,
                            'technician': stmt.excluded.technician,
                            'group_name': stmt.excluded.group_name,
                            'from_technician': stmt.excluded.from_technician,
                            'to_technician': stmt.excluded.to_technician,
                            'time_spent_minutes': stmt.excluded.time_spent_minutes,
                            'synced_at': stmt.excluded.synced_at
                        }
                    )
                    db.session.execute(stmt)
                    synced_count += 1
                    
                except Exception as e:
                    error_count += 1
                    if error_count <= 5:
                        logger.error(f"Error processing record: {e}")
            
            db.session.commit()
            
            result = {
                'success': True,
                'synced': synced_count,
                'errors': error_count
            }
            logger.info(f"Time Spent sync complete: {synced_count} records synced, {error_count} errors.")
            return result
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Sync failed: {e}")
            return {'success': False, 'error': str(e)}


def run_time_spent_sync(app):
    """Helper function to run sync with app context."""
    with app.app_context():
        service = TimeSpentSyncService()
        return service.sync()
