# FileVault Setup Instructions

This document provides comprehensive setup instructions for the FileVault system, including backend, frontend, database, and Docker deployment options.

## Prerequisites

Before setting up FileVault, ensure you have the following installed:

### Required Software
- **Docker & Docker Compose** (Latest version)
  - [Docker Desktop for Windows](https://docs.docker.com/desktop/windows/install/)
  - [Docker Desktop for macOS](https://docs.docker.com/desktop/mac/install/)
  - [Docker Engine for Linux](https://docs.docker.com/engine/install/)

### Development Prerequisites (Optional)
If you want to run the project without Docker or contribute to development:

- **Go** (1.21 or later)
  - Download from [golang.org](https://golang.org/download/)
  - Verify installation: `go version`

- **Node.js** (v16 or later) & npm
  - Download from [nodejs.org](https://nodejs.org/)
  - Verify installation: `node --version` && `npm --version`

- **PostgreSQL** (12 or later)
  - Download from [postgresql.org](https://www.postgresql.org/download/)
  - Or use Docker: `docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres`

- **Git**
  - Download from [git-scm.com](https://git-scm.com/)

## Quick Start (Docker - Recommended)

The fastest way to get FileVault running is using Docker Compose.

### 1. Clone the Repository

```bash
git clone https://github.com/BalkanID-University/vit-2026-capstone-internship-hiring-task-riyaautade.git
cd vit-2026-capstone-internship-hiring-task-riyaautade
```

### 2. Environment Configuration

Create environment files for development:

```bash
# Create backend environment file
cat > backend/.env << EOF
# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=filevault
DB_USER=postgres
DB_PASSWORD=password
DB_SSLMODE=disable

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Server Configuration
PORT=8080
UPLOAD_DIR=./uploads

# CORS Configuration
CORS_ORIGINS=http://localhost:3000

# Rate Limiting
RATE_LIMIT_REQUESTS_PER_MINUTE=100

# Storage Configuration
MAX_FILE_SIZE_MB=100
DEFAULT_STORAGE_QUOTA_MB=100
EOF

# Create frontend environment file
cat > frontend/.env << EOF
REACT_APP_GRAPHQL_URI=http://localhost:8080/graphql
REACT_APP_WS_URI=ws://localhost:8080/graphql
REACT_APP_UPLOAD_URI=http://localhost:8080/upload
EOF
```

### 3. Start the Application

```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Access the Application

After successful startup, you can access:

- **Frontend**: http://localhost:3000
- **GraphQL Playground**: http://localhost:8080/graphql
- **PostgreSQL**: localhost:5432

### 5. Default Login Credentials

The system comes with pre-configured users:

**Administrator Account**
- Email: `admin@filevault.com`
- Password: `admin123`

**Regular User Account**
- Email: `user@filevault.com`
- Password: `user123`

### 6. Verify Installation

1. Navigate to http://localhost:3000
2. Login with the admin credentials
3. Upload a test file
4. Check the admin panel at http://localhost:3000/admin

## Development Setup

For development and contribution, you may want to run services individually.

### Backend Development Setup

#### 1. Database Setup

```bash
# Using Docker for PostgreSQL
docker run --name filevault-db \
  -e POSTGRES_DB=filevault \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15

# Or install PostgreSQL locally and create database
createdb filevault
```

#### 2. Backend Configuration

```bash
cd backend

# Install Go dependencies
go mod download

# Create environment file (if not created above)
cp .env.example .env

# Edit .env file with your database credentials
```

#### 3. Run Database Migrations

```bash
# Install migrate tool (if needed)
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest

# Run migrations
migrate -path migrations -database "postgres://postgres:password@localhost/filevault?sslmode=disable" up

# Or use the init.sql script
psql -U postgres -d filevault -f ../database/init.sql
```

#### 4. Start Backend Server

```bash
# Development mode with hot reload
go run cmd/server/main.go

# Or build and run
go build -o server cmd/server/main.go
./server
```

Backend will be available at http://localhost:8080

### Frontend Development Setup

#### 1. Install Dependencies

```bash
cd frontend

# Install Node.js dependencies
npm install

# Or using Yarn
yarn install
```

#### 2. Environment Configuration

```bash
# Create environment file (if not created above)
cp .env.example .env

# Edit .env file with your backend URLs
```

#### 3. Start Frontend Development Server

```bash
# Start development server
npm start

# Or using Yarn
yarn start
```

Frontend will be available at http://localhost:3000

### Full Development Stack

To run the complete development stack:

```bash
# Terminal 1: Start database
docker run --name filevault-db -e POSTGRES_DB=filevault -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15

# Terminal 2: Start backend
cd backend
go run cmd/server/main.go

# Terminal 3: Start frontend
cd frontend
npm start
```

## Production Deployment

For production deployment, use the production Docker Compose configuration.

### 1. Production Environment

```bash
# Create production environment files
cat > backend/.env.production << EOF
DB_HOST=postgres
DB_PORT=5432
DB_NAME=filevault_prod
DB_USER=filevault_user
DB_PASSWORD=your-secure-database-password

JWT_SECRET=your-very-secure-jwt-secret-key

PORT=8080
UPLOAD_DIR=./uploads

CORS_ORIGINS=https://your-domain.com

RATE_LIMIT_REQUESTS_PER_MINUTE=60

MAX_FILE_SIZE_MB=500
DEFAULT_STORAGE_QUOTA_MB=1000
EOF

cat > frontend/.env.production << EOF
REACT_APP_GRAPHQL_URI=https://api.your-domain.com/graphql
REACT_APP_WS_URI=wss://api.your-domain.com/graphql
REACT_APP_UPLOAD_URI=https://api.your-domain.com/upload
EOF
```

### 2. Deploy with Docker Compose

```bash
# Build and start production services
docker-compose -f docker-compose.yml up -d --build

# Or use the production override
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### 3. SSL/HTTPS Setup

For production, set up SSL certificates using Let's Encrypt or your certificate provider:

```bash
# Add nginx or traefik reverse proxy
# Configure SSL certificates
# Update CORS_ORIGINS in backend environment
```

## Environment Variables Reference

### Backend Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DB_HOST` | PostgreSQL host | `localhost` | Yes |
| `DB_PORT` | PostgreSQL port | `5432` | Yes |
| `DB_NAME` | Database name | `filevault` | Yes |
| `DB_USER` | Database user | `postgres` | Yes |
| `DB_PASSWORD` | Database password | - | Yes |
| `DB_SSLMODE` | SSL mode for database | `disable` | No |
| `JWT_SECRET` | JWT signing secret | - | Yes |
| `PORT` | Server port | `8080` | No |
| `UPLOAD_DIR` | File upload directory | `./uploads` | No |
| `CORS_ORIGINS` | Allowed CORS origins | `*` | No |
| `RATE_LIMIT_REQUESTS_PER_MINUTE` | Rate limiting | `100` | No |
| `MAX_FILE_SIZE_MB` | Maximum file size | `100` | No |
| `DEFAULT_STORAGE_QUOTA_MB` | Default user quota | `100` | No |

### Frontend Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `REACT_APP_GRAPHQL_URI` | GraphQL API endpoint | `http://localhost:8080/graphql` | Yes |
| `REACT_APP_WS_URI` | WebSocket endpoint | `ws://localhost:8080/graphql` | No |
| `REACT_APP_UPLOAD_URI` | File upload endpoint | `http://localhost:8080/upload` | No |

## Troubleshooting

### Common Issues

#### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check database logs
docker logs filevault-db

# Test database connection
psql -h localhost -U postgres -d filevault
```

#### Backend Issues

```bash
# Check backend logs
docker logs filevault-backend

# Verify environment variables
docker exec filevault-backend printenv

# Check if backend is responding
curl http://localhost:8080/health
```

#### Frontend Issues

```bash
# Check frontend logs
docker logs filevault-frontend

# Verify build process
cd frontend && npm run build

# Check network connectivity to backend
curl http://localhost:8080/graphql -X POST -H "Content-Type: application/json" -d '{"query":"{ __typename }"}'
```

#### File Upload Issues

```bash
# Check upload directory permissions
ls -la backend/uploads/

# Verify disk space
df -h

# Check file size limits in nginx (if using)
grep client_max_body_size /etc/nginx/nginx.conf
```

### Performance Optimization

#### Database Optimization

```sql
-- Add indexes for better performance (already in migrations)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_files_content_hash ON files(content_hash);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_files_owner_id ON files(owner_id);

-- Analyze database statistics
ANALYZE;

-- Check slow queries
SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;
```

#### Backend Optimization

```bash
# Build optimized binary
cd backend
CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags '-w -s' -o server cmd/server/main.go

# Use production build
docker-compose -f docker-compose.prod.yml up -d
```

#### Frontend Optimization

```bash
# Build optimized frontend
cd frontend
npm run build

# Serve with nginx or serve static files from backend
```

## Backup and Recovery

### Database Backup

```bash
# Create backup
docker exec filevault-db pg_dump -U postgres filevault > backup.sql

# Restore backup
docker exec -i filevault-db psql -U postgres filevault < backup.sql
```

### File Storage Backup

```bash
# Backup uploaded files
tar -czf uploads-backup.tar.gz backend/uploads/

# Restore files
tar -xzf uploads-backup.tar.gz
```

## Security Considerations

1. **Change default passwords** in production
2. **Use strong JWT secrets** (32+ characters)
3. **Configure proper CORS origins**
4. **Set up HTTPS** with valid SSL certificates
5. **Regular security updates** for dependencies
6. **File upload validation** and scanning
7. **Rate limiting** and DDoS protection
8. **Database access restrictions**

## Monitoring and Logging

### Health Check Endpoints

- Backend health: `GET /health`
- Database health: Included in backend health check
- GraphQL introspection: `POST /graphql` with introspection query

### Log Collection

```bash
# Collect all service logs
docker-compose logs --timestamps > filevault-logs.txt

# Monitor logs in real-time
docker-compose logs -f

# Specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

For production monitoring, consider integrating with:
- **Prometheus** for metrics
- **Grafana** for visualization  
- **ELK Stack** for log analysis
- **Sentry** for error tracking

## Next Steps

After successful setup:

1. **Customize the application** according to your needs
2. **Set up monitoring** and alerting
3. **Configure backups** schedule
4. **Review security settings**
5. **Load test** the application
6. **Set up CI/CD** pipeline for deployments

For more information, refer to:
- [API Documentation](./API.md)
- [Database Schema](./DATABASE.md)
- [Architecture Overview](./ARCHITECTURE.md)
- [Contributing Guide](../CONTRIBUTING.md)