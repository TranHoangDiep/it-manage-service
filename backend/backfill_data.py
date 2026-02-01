from app import app
from models.ticket import db, Ticket
from sqlalchemy import func

def backfill_classification():
    with app.app_context():
        print("Starting backfill for classification...")
        
        # 1. Update Service Requests based on keywords
        sr_keywords = [
            'service request', 'yêu cầu', 'request', 'checklist', 'report', 
            'health check', 'healthcheck', 'monitor', 'cung cấp', 'bàn giao', 
            'ticket', 'daily', 'weekly', 'monthly', 'patching', 'update', 
            'upgrade', 'báo giá', 'invoice', 'hợp đồng', 'certificate'
        ]
        
        updated_sr = 0
        for k in sr_keywords:
            # Update request_type and is_service_request
            count = Ticket.query.filter(
                db.or_(
                    func.lower(Ticket.title).like(f'%{k}%'),
                    func.lower(Ticket.category).like(f'%{k}%')
                ),
                Ticket.is_service_request == False  # only if not already set
            ).update(
                {Ticket.is_service_request: True, Ticket.request_type: 'Service Request'},
                synchronize_session=False
            )
            updated_sr += count
        
        print(f"Updated {updated_sr} tickets as Service Requests.")

        # 2. Update Incidents (those not SR and matching incident keywords)
        inc_keywords = [
            'incident', 'lỗi', 'sự cố', 'hỏng', 'error', 'failure', 
            'troubleshoot', 'bảo hành', 'repair', 'hỗ trợ', 'fix', 'fault', 
            'broken', 'replace', 'down', 'critical', 'warning', 'high', 
            'usage', 'disconnected', 'không vào được', 'không khởi động', 
            'alert', 'expired', 'timeout', 'mất kết nối'
        ]
        
        updated_inc = 0
        for k in inc_keywords:
            count = Ticket.query.filter(
                db.or_(
                    func.lower(Ticket.title).like(f'%{k}%'),
                    func.lower(Ticket.category).like(f'%{k}%')
                ),
                Ticket.is_service_request == False # only if not already SR
            ).update(
                {Ticket.request_type: 'Incident'},
                synchronize_session=False
            )
            updated_inc += count
        
        print(f"Updated {updated_inc} tickets as Incidents.")

        # 3. Update Changes
        updated_changes = Ticket.query.filter(
            db.or_(
                func.lower(Ticket.title).like('%change%'),
                func.lower(Ticket.category).like('%change%')
            )
        ).update(
            {Ticket.request_type: 'Change Request', Ticket.category: 'Change'},
            synchronize_session=False
        )
        print(f"Updated {updated_changes} tickets as Changes.")

        db.session.commit()
        print("Backfill complete.")

if __name__ == "__main__":
    backfill_classification()
