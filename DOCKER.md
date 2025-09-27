# FileVault Docker Setup 🐋

This document provides instructions for running FileVault using Docker for local development and testing.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose v3.8 or higher
- At least 4GB of available RAM
- Ports 3000, 8080, and 5432 available on your system

## Quick Start

### 1. Clone and Navigate
```bash
git clone https://github.com/BalkanID-University/vit-2026-capstone-internship-hiring-task-riyaautade.git
cd vit-2026-capstone-internship-hiring-task-riyaautade
```

### 2. Environment Setup
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env file with your preferred settings (optional)
# The default values work fine for local development
```

### 3. Start the Application
```bash
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up --build -d
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **GraphQL Playground**: http://localhost:8080/graphql
- **Database**: localhost:5432

### 5. Default Login Credentials
- **Admin**: `admin` / `admin123`
- **User**: `user` / `user123`

## Architecture

### Services

1. **Frontend** (React + Nginx)
   - Port: 3000 (configurable via FRONTEND_PORT)
   - Serves optimized production build
   - Nginx handles routing and API proxying

2. **Backend** (Go + GraphQL)
   - Port: 8080 (configurable via BACKEND_PORT)
   - RESTful GraphQL API
   - File upload/download handling
   - JWT authentication

3. **Database** (PostgreSQL)
   - Port: 5432 (configurable via DB_PORT)
   - Persistent data storage
   - Automatic schema initialization

### Volumes

- `postgres_data`: Database files
- `backend_uploads`: Uploaded files
- `backend_storage`: Application storage

## Available Commands

### Basic Operations
```bash
# Start services
docker-compose up

# Start services in background
docker-compose up -d

# Stop services
docker-compose down

# Stop services and remove volumes (⚠️ deletes all data)
docker-compose down -v

# View logs
docker-compose logs

# View logs for specific service
docker-compose logs frontend
docker-compose logs backend
docker-compose logs database
```

### Development Commands
```bash
# Rebuild containers
docker-compose build

# Rebuild and start
docker-compose up --build

# Rebuild specific service
docker-compose build frontend

# Execute commands in containers
docker-compose exec backend /bin/sh
docker-compose exec frontend /bin/sh
docker-compose exec database psql -U filevault -d filevault
```

### Maintenance Commands
```bash
# Check service status
docker-compose ps

# View resource usage
docker stats

# Clean up unused Docker resources
docker system prune

# Remove all containers and images (⚠️ complete cleanup)
docker-compose down --rmi all --volumes --remove-orphans
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_NAME` | filevault | Database name |
| `DB_USER` | filevault | Database user |
| `DB_PASSWORD` | filevault123 | Database password |
| `DB_PORT` | 5432 | Database port |
| `BACKEND_PORT` | 8080 | Backend API port |
| `FRONTEND_PORT` | 3000 | Frontend port |
| `JWT_SECRET` | dev-jwt-secret | JWT signing secret |
| `RATE_LIMIT` | 100 | API rate limit |
| `STORAGE_QUOTA` | 104857600 | Storage quota in bytes (100MB) |

## Health Checks

All services include health checks:
- **Database**: PostgreSQL ready check
- **Backend**: HTTP endpoint availability
- **Frontend**: Nginx server response

Monitor health with:
```bash
docker-compose ps
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Change ports in .env file
   FRONTEND_PORT=3001
   BACKEND_PORT=8081
   DB_PORT=5433
   ```

2. **Database Connection Issues**
   ```bash
   # Check database logs
   docker-compose logs database
   
   # Restart database service
   docker-compose restart database
   ```

3. **Build Failures**
   ```bash
   # Clean rebuild
   docker-compose down
   docker-compose build --no-cache
   docker-compose up
   ```

4. **Permission Issues** (Linux/Mac)
   ```bash
   # Fix volume permissions
   sudo chown -R $USER:$USER .
   ```

### Logs and Debugging

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend

# Check container resources
docker stats

# Inspect container details
docker-compose exec backend env
```

### Database Management

```bash
# Connect to database
docker-compose exec database psql -U filevault -d filevault

# Backup database
docker-compose exec database pg_dump -U filevault filevault > backup.sql

# Restore database
docker-compose exec -T database psql -U filevault -d filevault < backup.sql
```

## Security Notes

### For Production Use

1. **Change Default Passwords**
   ```bash
   # Generate strong passwords
   DB_PASSWORD=your-strong-database-password
   JWT_SECRET=your-super-secret-jwt-key
   ```

2. **Use Environment Variables**
   - Never commit secrets to version control
   - Use Docker secrets or external secret management

3. **Network Security**
   - Configure firewall rules
   - Use HTTPS with proper certificates
   - Limit exposed ports

4. **Container Security**
   - Keep base images updated
   - Scan for vulnerabilities
   - Use non-root users (already implemented)

## Performance Tuning

### Database Optimization
```sql
-- Connect to database and run:
ANALYZE;
VACUUM;
```

### Container Resources
```yaml
# Add to docker-compose.yml services
deploy:
  resources:
    limits:
      memory: 512M
      cpus: '0.5'
```

## Support

For issues and questions:
1. Check the troubleshooting section above
2. View container logs: `docker-compose logs`
3. Check Docker system status: `docker system df`
4. Review the GitHub repository for updates

## License

This project is part of the VIT 2026 Capstone Internship Hiring Task.