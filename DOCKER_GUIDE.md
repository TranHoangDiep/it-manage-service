# Docker Deployment Guide

## Prerequisites
- Docker installed
- Docker Compose installed

## Quick Start

### 1. Stop local development servers (if running)
```bash
# Kill any process on port 5001
lsof -ti:5001 | xargs kill -9

# Kill any process on port 3000  
lsof -ti:3000 | xargs kill -9
```

### 2. Build and start containers
```bash
cd /Users/thdiep/Desktop/Project/itsm_report

# Build and start all services
docker-compose up --build -d

# Or build without cache
docker-compose build --no-cache
docker-compose up -d
```

### 3. Check container status
```bash
docker-compose ps
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 4. Access the application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001/api
- **Health Check**: http://localhost:5001/api/health

## Useful Commands

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Restart services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Stop and remove containers
```bash
# Stop containers
docker-compose stop

# Stop and remove containers
docker-compose down

# Remove containers and volumes
docker-compose down -v
```

### Rebuild after code changes
```bash
# Backend only
docker-compose up --build -d backend

# Frontend only
docker-compose up --build -d frontend

# Both
docker-compose up --build -d
```

### Execute commands in container
```bash
# Backend shell
docker-compose exec backend bash

# Run migrations
docker-compose exec backend flask db upgrade

# Python shell
docker-compose exec backend python
```

## Configuration

### Environment Variables
Backend environment variables are loaded from `backend/.env`:
- `DATABASE_URL`: PostgreSQL connection string
- `SDP_API_KEY`: ManageEngine API key
- `SDP_BASE_URL`: ManageEngine API URL
- `JWT_SECRET_KEY`: JWT secret for authentication

### Ports
- **Frontend**: 3000 (Nginx)
- **Backend**: 5001 (Flask via Gunicorn)
- **Database**: Remote PostgreSQL at 10.222.240.12:5432

## Troubleshooting

### Port already in use
```bash
# Check what's using the port
lsof -i :5001
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Container won't start
```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Rebuild without cache
docker-compose build --no-cache
docker-compose up -d
```

### Database connection issues
```bash
# Test database connection from host
psql -h 10.222.240.12 -U postgres -d itsm_report

# Test from backend container
docker-compose exec backend python -c "from app import db; print(db.engine.url)"
```

### Clear everything and start fresh
```bash
docker-compose down -v
docker system prune -a
docker-compose up --build -d
```

## Production Deployment

For production deployment:
1. Update `FLASK_ENV=production` in docker-compose.yml
2. Set strong `JWT_SECRET_KEY`
3. Use proper SSL/TLS certificates
4. Configure firewall rules
5. Set up monitoring and logging
6. Use Docker secrets for sensitive data
