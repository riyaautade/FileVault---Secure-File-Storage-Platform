# 🐋 FileVault Docker Deployment Guide

## Quick Start (For BalkanID Team)

### Prerequisites
- Docker installed on your system
- Docker Compose installed

### Running the Application

1. **Clone the repository:**
   ```bash
   git clone https://github.com/BalkanID-University/vit-2026-capstone-internship-hiring-task-riyaautade.git
   cd vit-2026-capstone-internship-hiring-task-riyaautade
   ```

2. **Start all services:**
   ```bash
   docker-compose up
   ```

3. **Access the application:**
   - **Frontend:** http://localhost:3000
   - **Backend API:** http://localhost:8080
   - **GraphQL Playground:** http://localhost:8080/query

That's it! 🚀 No additional setup required.

## What Docker Does Automatically

### ✅ Dependencies Management
- **Frontend:** Automatically downloads all npm packages (React, Chakra UI, etc.)
- **Backend:** Automatically downloads all Go modules (GraphQL, JWT, GORM, etc.)
- **Database:** PostgreSQL container with automatic setup

### ✅ Environment Setup
- Creates isolated containers for each service
- Sets up networking between containers
- Manages environment variables
- Creates necessary volumes for data persistence

### ✅ Production-Ready Build
- Frontend: Optimized React production build served by Nginx
- Backend: Compiled Go binary in minimal Alpine container
- Database: PostgreSQL with proper configuration

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React)       │    │     (Go)        │    │ (PostgreSQL)    │
│   Port: 3000    │───▶│   Port: 8080    │───▶│   Port: 5432    │
│   Nginx         │    │   GraphQL API   │    │   FileVault DB  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Available Commands

### Start Services
```bash
# Start all services in detached mode
docker-compose up -d

# Start with logs visible
docker-compose up

# Start specific service
docker-compose up frontend
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (clears database)
docker-compose down -v
```

### View Logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs frontend
docker-compose logs backend
docker-compose logs database
```

### Development Mode
```bash
# Rebuild containers after code changes
docker-compose up --build

# Force rebuild
docker-compose build --no-cache
```

## Default Credentials

**Admin User:**
- Email: admin@filevault.com
- Password: admin123

## Volumes and Data Persistence

- **Database:** Data persists in `postgres_data` volume
- **File Uploads:** Stored in `backend/uploads` directory
- **Logs:** Available via `docker-compose logs`

## Environment Variables

All environment variables are configured in `docker-compose.yml`:
- Database connection strings
- JWT secrets
- API endpoints
- CORS settings

## Troubleshooting

### Common Issues:

1. **Port conflicts:** If ports 3000, 8080, or 5432 are in use:
   ```bash
   # Check what's using the port
   netstat -ano | findstr :3000
   
   # Kill the process or change ports in docker-compose.yml
   ```

2. **Database connection issues:**
   ```bash
   # Check if database is running
   docker-compose ps
   
   # View database logs
   docker-compose logs database
   ```

3. **Permission issues:**
   ```bash
   # Reset Docker
   docker-compose down
   docker-compose up --build
   ```

## Features Available

✅ **Authentication & Authorization**
- JWT-based login/logout
- Role-based access control (Admin, User, Guest)

✅ **File Management**
- Upload/download files
- File preview (images, PDFs, text)
- Folder organization

✅ **User Management** (Admin only)
- Create/edit/delete users
- Role assignment

✅ **Analytics Dashboard**
- Real-time storage statistics
- File type distribution
- Usage analytics

✅ **Audit Logging**
- Comprehensive activity tracking (25+ action types)
- Detailed audit trails
- Advanced filtering and search

## Support

For issues or questions about deployment, please refer to the main repository or contact the development team.

---

**Note:** This Docker setup provides a complete production-ready environment with zero manual dependency management required.