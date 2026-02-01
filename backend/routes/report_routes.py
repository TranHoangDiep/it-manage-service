from flask import Blueprint, jsonify, request
from services.itsm_service import ITSMService
import calendar
from datetime import datetime

report_bp = Blueprint('report', __name__)
itsm_service = ITSMService()

@report_bp.route('/api/v1/reports/itsm/monthly', methods=['GET'])
def get_monthly_report():
    customer_id = request.args.get('customer_id')
    year_str = request.args.get('year')
    month_str = request.args.get('month')

    if not all([customer_id, year_str, month_str]):
        return jsonify({"error": "customer_id, year, and month are required"}), 400

    try:
        year = int(year_str)
        month = int(month_str)
        if not (1 <= month <= 12):
            raise ValueError("Month must be between 1 and 12")
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    # Calculate last day of the month
    _, last_day = calendar.monthrange(year, month)

    weeks = []
    ranges = [
        (1, 7),
        (8, 14),
        (15, 21),
        (22, 28)
    ]
    
    # Handle up to Week 4
    for i, (start, end) in enumerate(ranges, 1):
        weeks.append({
            "week_number": i,
            "from_date": f"{year:04d}-{month:02d}-{start:02d}",
            "to_date": f"{year:04d}-{month:02d}-{end:02d}"
        })
    
    # Handle Week 5
    if last_day >= 29:
        weeks.append({
            "week_number": 5,
            "from_date": f"{year:04d}-{month:02d}-29",
            "to_date": f"{year:04d}-{month:02d}-{last_day:02d}"
        })

    # Prepare complete response data
    report_data = {
        "customer_id": customer_id,
        "year": year,
        "month": month,
        "total_days": last_day,
        "weekly_breakdown": []
    }

    # Fetch data for each week
    for week in weeks:
        from_dt = datetime.strptime(week['from_date'], '%Y-%m-%d')
        # End date should be end of day
        to_dt = datetime.strptime(week['to_date'], '%Y-%m-%d').replace(hour=23, minute=59, second=59)
        
        # Get data from service
        stats = itsm_service.get_stats_for_range(customer_id, from_dt, to_dt)
        
        report_data['weekly_breakdown'].append({
            **week,
            "summary": stats
        })

    return jsonify(report_data)

@report_bp.route('/api/v1/reports/itsm/forecast', methods=['GET'])
def get_report_forecast():
    customer_id = request.args.get('customer_id')
    year_str = request.args.get('year')
    month_str = request.args.get('month')

    if not all([customer_id, year_str, month_str]):
        return jsonify({"error": "customer_id, year, and month are required"}), 400

    try:
        year = int(year_str)
        month = int(month_str)
        forecast = itsm_service.get_forecast(customer_id, year, month)
        return jsonify(forecast)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
