import os
import logging
import urllib.parse
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

logger = logging.getLogger(__name__)

class ITSMQueryService:
    """
    Service to query the ManageEngine ServiceDesk Plus (ITSM) database directly.
    Supports connection via environment variables.
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
                logger.info("ITSM Database Engine initialized.")
            except Exception as e:
                logger.error(f"Failed to create engine: {e}")

    def _construct_db_url(self):
        """Constructs the SQLAlchemy URL for MSSQL."""
        server = os.environ.get('SDP_DB_HOST')
        database = os.environ.get('SDP_DB_NAME')
        user = os.environ.get('SDP_DB_USER')
        password = os.environ.get('SDP_DB_PASS')
        port = os.environ.get('SDP_DB_PORT', '1433')
        driver = os.environ.get('SDP_DB_DRIVER', 'mssql+pyodbc')

        if not all([server, database, user, password]):
            return None

        params = urllib.parse.quote_plus(
            f"DRIVER={{ODBC Driver 17 for SQL Server}};"
            f"SERVER={server},{port};"
            f"DATABASE={database};"
            f"UID={user};"
            f"PWD={password}"
        )
        return f"{driver}:///?odbc_connect={params}"

    def execute_query(self, sql_query, params=None):
        """Executes a raw SQL query and returns results as list of dicts."""
        if not self.engine:
            raise Exception("ITSM Database not configured. Check environment variables.")

        try:
            with self.engine.connect() as conn:
                result = conn.execute(text(sql_query), params or {})
                # Fetch all and convert to dictionary
                return [dict(row._mapping) for row in result.fetchall()]
        except SQLAlchemyError as e:
            logger.error(f"Database query error: {e}")
            raise

    def get_worklogs_by_ticket(self, ticket_id):
        """Helper to get all worklogs for a specific ticket ID using the identified Charges table."""
        query = """
            SELECT 
                wlc.REQUESTCHARGEID as log_id,
                au.first_name + ' ' + au.last_name as technician,
                wlc.TIMESPENT / 3600000.0 as hours,
                wlc.TIMESPENT as ms_raw
            FROM dbo.Arc_WorkLogCharges wlc
            INNER JOIN dbo.WorkLog wl ON wlc.REQUESTCHARGEID = wl.WORKLOGID
            LEFT JOIN dbo.AaaUser au ON wl.USERID = au.USER_ID
            WHERE wl.REQUESTID = :ticket_id
            ORDER BY wlc.REQUESTCHARGEID DESC
        """
        return self.execute_query(query, {"ticket_id": ticket_id})

    def get_customer_monthly_workload(self, account_name, year, month):
        """Generic query to analyze workload for a customer in a specific month."""
        # Convert year/month to timestamp range if needed, or use SQL DATEPART
        query = """
            SELECT 
                au.first_name + ' ' + au.last_name as technician,
                SUM(wl.timespent) / 3600000.0 as total_hours,
                COUNT(wl.worklogid) as task_count
            FROM WorkLog wl
            INNER JOIN WorkOrder wo ON wl.requestid = wo.workorderid
            INNER JOIN AccountDefinition ad ON wo.accountid = ad.accountid
            LEFT JOIN AaaUser au ON wl.userid = au.user_id
            WHERE ad.accountname = :account_name
              AND DATEPART(year, DATEADD(s, wl.createdtime/1000, '1970-01-01')) = :year
              AND DATEPART(month, DATEADD(s, wl.createdtime/1000, '1970-01-01')) = :month
            GROUP BY au.first_name, au.last_name
        """
        return self.execute_query(query, {"account_name": account_name, "year": year, "month": month})

    def get_time_spent_report(self, filters=None):
        """
        Query time spent from WO_TECH_INFO table.
        This is the accurate source for time spent in ManageEngine.
        
        Args:
            filters: dict with optional keys:
                - technician: filter by technician name
                - group: filter by group/queue name
                - category: filter by category name
                - limit: number of records (default 1000)
        """
        filters = filters or {}
        limit = filters.get('limit', 1000)
        
        query = f"""
            SELECT TOP {limit}
                wo.WORKORDERID AS request_id,
                wo.TITLE AS subject,
                cd.CATEGORYNAME AS category,
                scd.NAME AS subcategory,
                icd.NAME AS item,
                ti.FIRST_NAME AS technician,
                qd.QUEUENAME AS group_name,
                ti1.FIRST_NAME AS from_technician,
                ti2.FIRST_NAME AS to_technician,
                wti.timespent AS time_spent_minutes,
                CAST(TRY_CAST(wti.timespent AS INT) / 60 AS varchar(20)) 
                    + ':' + 
                    RIGHT('00' + CAST(TRY_CAST(wti.timespent AS INT) % 60 AS varchar(2)), 2) 
                    AS time_spent_formatted
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
            WHERE wti.timespent IS NOT NULL AND wti.timespent > 0
            ORDER BY wo.WORKORDERID DESC
        """
        return self.execute_query(query)

    def get_time_spent_by_ticket(self, ticket_id):
        """Get all time spent entries for a specific ticket from WO_TECH_INFO."""
        query = """
            SELECT 
                wti.ASSESSMENTID AS assessment_id,
                ti.FIRST_NAME AS technician,
                ti1.FIRST_NAME AS from_technician,
                ti2.FIRST_NAME AS to_technician,
                wti.timespent AS time_spent_minutes,
                CAST(TRY_CAST(wti.timespent AS INT) / 60 AS varchar(20)) 
                    + ':' + 
                    RIGHT('00' + CAST(TRY_CAST(wti.timespent AS INT) % 60 AS varchar(2)), 2) 
                    AS time_spent_formatted
            FROM WorkOrder wo
            LEFT JOIN WorkOrderStates wos ON wo.WORKORDERID = wos.WORKORDERID
            LEFT JOIN SDUser td ON wos.OWNERID = td.USERID
            LEFT JOIN AaaUser ti ON td.USERID = ti.USER_ID
            LEFT JOIN wo_assessment woa ON wo.WORKORDERID = woa.WORKORDERID
            INNER JOIN WO_TECH_INFO wti ON woa.ASSESSMENTID = wti.ASSESSMENTID
            LEFT JOIN AaaUser ti1 ON wti.TECHNICIANID = ti1.USER_ID
            LEFT JOIN AaaUser ti2 ON wti.NEXTTECHNICIANID = ti2.USER_ID
            WHERE wo.WORKORDERID = :ticket_id
            ORDER BY wti.ASSESSMENTID DESC
        """
        return self.execute_query(query, {"ticket_id": ticket_id})

    def get_time_spent_summary_by_technician(self, year=None, month=None):
        """Get summary of time spent grouped by technician."""
        where_clause = "WHERE wti.timespent IS NOT NULL AND wti.timespent > 0"
        params = {}
        
        if year:
            where_clause += " AND DATEPART(year, wo.CREATEDTIME) = :year"
            params["year"] = year
        if month:
            where_clause += " AND DATEPART(month, wo.CREATEDTIME) = :month"
            params["month"] = month
        
        query = f"""
            SELECT 
                ti.FIRST_NAME AS technician,
                qd.QUEUENAME AS group_name,
                COUNT(DISTINCT wo.WORKORDERID) AS ticket_count,
                SUM(TRY_CAST(wti.timespent AS INT)) AS total_time_minutes,
                SUM(TRY_CAST(wti.timespent AS INT)) / 60 AS total_hours,
                SUM(TRY_CAST(wti.timespent AS INT)) % 60 AS remaining_minutes
            FROM WorkOrder wo
            LEFT JOIN WorkOrderStates wos ON wo.WORKORDERID = wos.WORKORDERID
            LEFT JOIN SDUser td ON wos.OWNERID = td.USERID
            LEFT JOIN AaaUser ti ON td.USERID = ti.USER_ID
            LEFT JOIN WorkOrder_Queue woq ON wo.WORKORDERID = woq.WORKORDERID
            LEFT JOIN QueueDefinition qd ON woq.QUEUEID = qd.QUEUEID
            LEFT JOIN wo_assessment woa ON wo.WORKORDERID = woa.WORKORDERID
            INNER JOIN WO_TECH_INFO wti ON woa.ASSESSMENTID = wti.ASSESSMENTID
            {where_clause}
            GROUP BY ti.FIRST_NAME, qd.QUEUENAME
            ORDER BY total_time_minutes DESC
        """
        return self.execute_query(query, params)
