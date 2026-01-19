# CMC OpsCenter - IT Operations Management Platform

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Python](https://img.shields.io/badge/python-3.11+-yellow.svg)
![React](https://img.shields.io/badge/react-18-blue.svg)

**Nền tảng quản lý vận hành CNTT toàn diện cho Managed Service Providers (MSP)**

</div>

---

## 🎯 Overview

CMC OpsCenter là nền tảng IT Operations Management được thiết kế cho các nhà cung cấp dịch vụ quản lý (MSP), tích hợp CMDB, Alarm Management, SLA Tracking, và Customer Portal vào một hệ thống thống nhất.

### Tính năng chính

| Module | Mô tả |
|--------|-------|
| **Dashboards** | Executive, NOC, SLA/KPI, Capacity views |
| **CMDB** | Quản lý tài sản (VM, Network, Relationships) |
| **Alarms** | Real-time monitoring, correlation, auto-ticketing |
| **Services** | Service catalog với subscription tracking |
| **Customers** | Multi-tenant customer portal |
| **Projects** | Project & change management |
| **People** | Engineers, schedules, skill matrix |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                  │
├─────────────────────────────────────────────────────────────┤
│                     Backend (Flask API)                      │
├─────────────┬─────────────┬─────────────┬──────────────────┤
│   CMDB      │   Alarms    │   Services  │   Integration    │
│   Service   │   Service   │   Catalog   │   Layer          │
├─────────────┴─────────────┴─────────────┴──────────────────┤
│                   PostgreSQL Database                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+

### 1. Clone & Setup

```bash
git clone <repository-url>
cd itsm_report
```

### 2. Backend

```bash
cd backend

# Virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Run
python app.py
```

### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

### 4. Access

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |

---

## 🐳 Docker Deployment

### Quick Start

```bash
docker-compose up -d
```

### Production Build

```bash
# Build images
docker-compose build

# Run with environment variables
docker-compose up -d
```

### Access (Docker)

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |

---

## 📁 Project Structure

```
itsm_report/
├── backend/
│   ├── models/
│   │   ├── cmdb.py        # CI, Relationships, Services, SLA, Alarms
│   │   ├── people.py      # Engineers, Contacts, Projects
│   │   └── ticket.py      # ITSM Tickets
│   ├── routes/
│   │   └── cmdb_routes.py # CMDB API endpoints
│   ├── services/
│   │   └── itsm_service.py
│   ├── app.py             # Flask application
│   └── config.py          # Configuration
│
├── frontend/
│   ├── src/
│   │   ├── components/    # Sidebar, Layout
│   │   ├── pages/         # Dashboard, CMDB, Alarms...
│   │   └── services/      # API client
│   └── package.json
│
└── docker-compose.yml
```

---

## 🗄️ Data Models

### CMDB Core

| Model | Purpose |
|-------|---------|
| `CI` | Configuration Items (VM, Host, Network devices) |
| `CIRelationship` | Dependencies between CIs |
| `Location` | Physical locations (DC, Rack) |
| `Service` | Service catalog items |
| `CustomerService` | Customer subscriptions |
| `SLA` | SLA definitions |
| `Alarm` | Monitoring alerts |
| `AlarmRule` | Auto-ticketing rules |

### People & Operations

| Model | Purpose |
|-------|---------|
| `Engineer` | NOC/MSP staff |
| `EngineerSkill` | Skills & certifications |
| `OnDutySchedule` | Shift schedules |
| `Contact` | Customer/Vendor contacts |
| `Project` | Projects & changes |

---

## 🔌 API Endpoints

### CMDB

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cmdb/assets` | List all CIs |
| GET | `/api/cmdb/assets/:id` | Get CI with relationships |
| POST | `/api/cmdb/assets` | Create CI |
| PUT | `/api/cmdb/assets/:id` | Update CI |
| DELETE | `/api/cmdb/assets/:id` | Delete CI |
| GET | `/api/cmdb/relationships` | List relationships |
| GET | `/api/cmdb/services` | Service catalog |
| GET | `/api/cmdb/slas` | SLA definitions |
| GET | `/api/cmdb/stats` | CMDB statistics |

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/summary` | Dashboard overview |
| GET | `/api/customers` | Customer list |
| GET | `/api/engineers` | Engineer list |

---

## ⚙️ Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `JWT_SECRET_KEY` | JWT signing key | ✅ |
| `SDP_API_KEY` | ManageEngine ServiceDesk Plus API key | Optional |
| `SDP_BASE_URL` | ManageEngine URL | Optional |

---

## 🔄 Integration

### Prometheus/Alertmanager

```yaml
# alertmanager.yml
receivers:
  - name: 'opscenter'
    webhook_configs:
      - url: 'http://opscenter:5000/api/webhooks/alertmanager'
```

### ServiceDesk Plus

Configure in `.env`:
```
SDP_API_KEY=your-api-key
SDP_BASE_URL=https://your-sdp.com
```

---

## 📊 Dashboards

| Dashboard | Audience | Key Widgets |
|-----------|----------|-------------|
| Executive | Management | Customer health, SLA trends |
| NOC | L1/L2 Engineers | Active alarms, on-duty roster |
| SLA & KPI | Service Managers | SLA compliance, MTTR, MTTA |
| Capacity | Capacity Planners | Resource utilization |

---

## 🛣️ Roadmap

- [ ] Prometheus webhook integration
- [ ] Auto-ticket creation from alarms
- [ ] Customer self-service portal
- [ ] AI-powered alarm correlation
- [ ] Mobile responsive design

---

## 📄 License

MIT License - CMC Telecom Services © 2026
