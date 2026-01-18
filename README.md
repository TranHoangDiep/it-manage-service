# ITSM Report Dashboard

Hệ thống quản lý và giám sát dịch vụ CNTT toàn diện cho doanh nghiệp.

## 🚀 Features

- **Dashboard** - Tổng quan ticket, SLA, top customers
- **CMDB** - Quản lý tài sản ảo hóa (vCenter, Host, VM)
- **Alarm Notes** - Ghi chú và theo dõi cảnh báo hạ tầng
- **Projects** - Quản lý dự án và team allocation
- **Members** - Quản lý thành viên và phân quyền
- **Contacts** - Danh bạ liên hệ khách hàng
- **Authentication** - JWT với phân quyền Leader/Member

## 📋 Tech Stack

**Backend:**
- Python 3.11+
- Flask
- Flask-SQLAlchemy
- PostgreSQL
- JWT Authentication

**Frontend:**
- React 18
- Vite
- Tailwind CSS
- Recharts
- Lucide React Icons

## 🛠️ Installation

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Configure database
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/itsm_report"

# Run server
python app.py
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

### Create Demo Accounts

```bash
# Leader account
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"leader@demo.vn","password":"123456","full_name":"Nguyen Leader","role":"leader"}'

# Member account
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"member@demo.vn","password":"123456","full_name":"Tran Member","role":"member"}'
```

## 🐳 Docker

### Quick Start

```bash
docker-compose up -d
```

Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Build Images

```bash
# Backend
docker build -t itsm-backend ./backend

# Frontend
docker build -t itsm-frontend ./frontend
```

## 📁 Project Structure

```
itsm_report/
├── backend/
│   ├── models/          # Database models
│   ├── services/        # Business logic
│   ├── app.py           # Flask application
│   └── config.py        # Configuration
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── contexts/    # Auth context
│   │   ├── pages/       # Page components
│   │   └── services/    # API client
│   └── package.json
└── docker-compose.yml
```

## 🔐 Role Permissions

| Feature | Leader | Member |
|---------|:------:|:------:|
| View Dashboard | ✅ | ✅ |
| Manage Members | ✅ | ❌ |
| Manage CMDB | ✅ | ❌ |
| View Projects | ✅ | ✅ |
| View Alarms | ✅ | ✅ |

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://postgres:postgres@localhost:5432/itsm_report` |
| `JWT_SECRET_KEY` | JWT signing key | Auto-generated |
| `SDP_API_KEY` | ManageEngine API key | - |
| `SDP_BASE_URL` | ManageEngine URL | - |

## 📄 License

MIT License - CMC TS © 2026
