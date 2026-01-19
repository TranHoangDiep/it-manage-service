# CMC OpsCenter - Hướng dẫn triển khai

## Mục lục

1. [Yêu cầu hệ thống](#1-yêu-cầu-hệ-thống)
2. [Cài đặt môi trường phát triển](#2-cài-đặt-môi-trường-phát-triển)
3. [Triển khai Production với Docker](#3-triển-khai-production-với-docker)
4. [Cấu hình hệ thống](#4-cấu-hình-hệ-thống)
5. [Tích hợp bên ngoài](#5-tích-hợp-bên-ngoài)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Yêu cầu hệ thống

### Development

| Component | Version | Ghi chú |
|-----------|---------|---------|
| Python | 3.11+ | Backend |
| Node.js | 18+ | Frontend build |
| PostgreSQL | 14+ | Database |

### Production

| Component | Version | Ghi chú |
|-----------|---------|---------|
| Docker | 24+ | Container runtime |
| Docker Compose | 2.0+ | Orchestration |
| RAM | 4GB+ | Recommended |
| Disk | 20GB+ | For logs & data |

---

## 2. Cài đặt môi trường phát triển

### 2.1 Clone repository

```bash
git clone <repository-url>
cd itsm_report
```

### 2.2 Backend Setup

```bash
cd backend

# Tạo virtual environment
python -m venv venv

# Kích hoạt (MacOS/Linux)
source venv/bin/activate

# Kích hoạt (Windows)
venv\Scripts\activate

# Cài đặt dependencies
pip install -r requirements.txt

# Sao chép file cấu hình
cp .env.example .env
```

**Cấu hình `.env`:**

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/itsm_report

# JWT Secret (tự generate hoặc để trống để auto-generate)
JWT_SECRET_KEY=your-secret-key-here

# ManageEngine ServiceDesk Plus (optional)
SDP_API_KEY=your-api-key
SDP_BASE_URL=https://your-sdp-instance.com
```

**Khởi động backend:**

```bash
python app.py
```

Backend chạy tại: `http://localhost:5000`

### 2.3 Frontend Setup

```bash
cd frontend

# Cài đặt dependencies
npm install

# Khởi động dev server
npm run dev
```

Frontend chạy tại: `http://localhost:5173`

### 2.4 Database Setup

```bash
# Tạo database (nếu chưa có)
createdb itsm_report

# Hoặc dùng psql
psql -U postgres -c "CREATE DATABASE itsm_report;"
```

Tables sẽ được tự động tạo khi backend khởi động lần đầu.

---

## 3. Triển khai Production với Docker

### 3.1 Chuẩn bị

```bash
# Clone repository
git clone <repository-url>
cd itsm_report

# Tạo file environment
cp backend/.env.example backend/.env
```

### 3.2 Cấu hình Docker Compose

Chỉnh sửa `docker-compose.yml` nếu cần:

```yaml
services:
  postgres:
    environment:
      POSTGRES_PASSWORD: your-secure-password

  backend:
    environment:
      DATABASE_URL: postgresql://postgres:your-secure-password@postgres:5432/itsm_report
      JWT_SECRET_KEY: your-production-secret
```

### 3.3 Build và Run

```bash
# Build images
docker-compose build

# Khởi động tất cả services
docker-compose up -d

# Kiểm tra logs
docker-compose logs -f
```

### 3.4 Kiểm tra services

```bash
# Kiểm tra containers đang chạy
docker-compose ps

# Kiểm tra health
curl http://localhost:5000/api/health
curl http://localhost:3000
```

### 3.5 Quản lý

```bash
# Dừng services
docker-compose down

# Restart một service
docker-compose restart backend

# Xem logs của một service
docker-compose logs -f backend

# Vào shell container
docker-compose exec backend bash
```

---

## 4. Cấu hình hệ thống

### 4.1 Environment Variables

| Variable | Mô tả | Bắt buộc |
|----------|-------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `JWT_SECRET_KEY` | Key để sign JWT tokens | ✅ |
| `SDP_API_KEY` | API key cho ManageEngine | ❌ |
| `SDP_BASE_URL` | URL ManageEngine instance | ❌ |

### 4.2 Database Migration

Khi có thay đổi schema:

```bash
cd backend

# Tạo migration
flask db migrate -m "description"

# Apply migration
flask db upgrade
```

### 4.3 Nginx Reverse Proxy (Production)

```nginx
server {
    listen 80;
    server_name opscenter.your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    # API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 5. Tích hợp bên ngoài

### 5.1 ManageEngine ServiceDesk Plus

1. Đăng nhập Admin Console của SDP
2. Vào Setup → API → Generate API Key
3. Thêm vào `.env`:

```bash
SDP_API_KEY=xxxxxx
SDP_BASE_URL=https://itsm.your-domain.com
```

### 5.2 Prometheus/Alertmanager (Tương lai)

Cấu hình Alertmanager để gửi webhook:

```yaml
# alertmanager.yml
receivers:
  - name: 'opscenter'
    webhook_configs:
      - url: 'http://opscenter.internal:5000/api/webhooks/alertmanager'
        send_resolved: true
```

---

## 6. Troubleshooting

### Backend không start

```bash
# Kiểm tra port đang bị chiếm
lsof -i :5000

# Trên MacOS, port 5000 có thể bị AirPlay chiếm
# Chuyển sang port khác hoặc tắt AirPlay Receiver
```

### Database connection failed

```bash
# Kiểm tra PostgreSQL đang chạy
pg_isready -h localhost -p 5432

# Kiểm tra database tồn tại
psql -U postgres -l | grep itsm_report
```

### Frontend build lỗi

```bash
# Clear cache
rm -rf node_modules/.vite
rm -rf node_modules

# Reinstall
npm install
```

### Docker issues

```bash
# Rebuild từ đầu
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

---

## Liên hệ hỗ trợ

- **Technical Support:** devops@cmcts.com.vn
- **Documentation:** https://docs.cmcts.com.vn/opscenter

---

*CMC Telecom Services © 2026*
