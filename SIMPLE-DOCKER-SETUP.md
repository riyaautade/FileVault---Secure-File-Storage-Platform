# FileVault - Simple Docker Deployment

## Quick Setup (Choose Option 1 OR Option 2)

### Option 1: Full Docker Setup

1. **Clone repository:**
```bash
git clone https://github.com/BalkanID-University/vit-2026-capstone-internship-hiring-task-riyaautade.git
cd vit-2026-capstone-internship-hiring-task-riyaautade
```

2. **Build images:**
```bash
docker build -t filevault-backend ./backend
docker build -t filevault-frontend ./frontend
```

3. **Start database:**
```bash
docker run -d --name filevault-db -p 5432:5432 \
  -e POSTGRES_DB=filevault \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=password \
  postgres:13
```

4. **Start backend:**
```bash
docker run -d --name filevault-backend -p 8080:8080 filevault-backend
```

5. **Start frontend:**
```bash
docker run -d --name filevault-frontend -p 3000:3000 filevault-frontend
```

6. **Access application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080

### Option 2: Hybrid Setup (Recommended)

1. **Install PostgreSQL locally** or use Docker for database only:
```bash
docker run -d --name postgres -p 5432:5432 \
  -e POSTGRES_DB=filevault \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=password \
  postgres:13
```

2. **Use Docker containers for app:**
```bash
docker build -t filevault-backend ./backend
docker build -t filevault-frontend ./frontend
docker run -d -p 8080:8080 filevault-backend
docker run -d -p 3000:3000 filevault-frontend
```

## Default Credentials
- Email: admin@filevault.com  
- Password: admin123

## Features Available
✅ Complete file management system
✅ User authentication & authorization  
✅ Analytics dashboard
✅ Audit logging system
✅ All major features implemented

---
**Note: Both options provide a fully working FileVault application!**