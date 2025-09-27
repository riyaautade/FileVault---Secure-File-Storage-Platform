# FileVault System Architecture & Design

This document provides a comprehensive overview of the FileVault system architecture, design decisions, technical implementation details, and rationale behind key choices.

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Overview](#architecture-overview)
3. [Technology Stack](#technology-stack)
4. [Core Components](#core-components)
5. [Database Design](#database-design)
6. [API Design](#api-design)
7. [Security Architecture](#security-architecture)
8. [File Storage & Deduplication](#file-storage--deduplication)
9. [Real-time Features](#real-time-features)
10. [Performance Considerations](#performance-considerations)
11. [Scalability & Deployment](#scalability--deployment)
12. [Design Decisions & Trade-offs](#design-decisions--trade-offs)

## System Overview

FileVault is a modern, secure file storage and sharing system designed for efficient file management with enterprise-grade features. The system supports file deduplication, hierarchical organization, user collaboration, and comprehensive analytics.

### Key Features
- **Secure File Storage**: Encrypted storage with access controls
- **File Deduplication**: Automatic detection and elimination of duplicate files
- **Hierarchical Organization**: Folder-based file organization
- **User Collaboration**: File and folder sharing between users
- **Real-time Updates**: Live activity feeds and notifications
- **Advanced Analytics**: Storage analytics and usage statistics
- **Role-Based Access Control**: Admin, user, and guest roles
- **Audit Logging**: Comprehensive activity tracking

### Design Goals
1. **Security**: Protect user data with modern security practices
2. **Performance**: Fast file operations and responsive UI
3. **Scalability**: Support growing user bases and data volumes
4. **Usability**: Intuitive interface for all user skill levels
5. **Reliability**: High availability and data integrity
6. **Maintainability**: Clean, documented, and testable code

## Architecture Overview

FileVault follows a modern three-tier architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│                           Frontend                               │
│                     (React + TypeScript)                        │
├─────────────────────────────────────────────────────────────────┤
│                          API Layer                               │
│                    (Go + GraphQL + REST)                        │
├─────────────────────────────────────────────────────────────────┤
│                        Data Layer                                │
│              (PostgreSQL + File System Storage)                 │
└─────────────────────────────────────────────────────────────────┘
```

### Architecture Principles

#### 1. **Microservice-Ready Design**
While currently deployed as a monolith for simplicity, the architecture supports future decomposition into microservices:
- **API Gateway**: GraphQL serves as a unified interface
- **Service Boundaries**: Clear domain separation (auth, storage, analytics)
- **Database per Service**: Potential for service-specific databases

#### 2. **Event-Driven Architecture**
- **Real-time Updates**: WebSocket subscriptions for live data
- **Audit Logging**: All actions generate immutable audit events
- **Analytics**: Event sourcing for usage statistics

#### 3. **Security-First Design**
- **Authentication**: JWT-based stateless authentication
- **Authorization**: Role-based access control with resource-level permissions
- **Data Protection**: Password hashing, secure file storage

#### 4. **Performance Optimization**
- **File Deduplication**: SHA256-based content addressing
- **Database Indexing**: Optimized queries for common operations
- **Caching Strategy**: Client-side caching with Apollo Client

## Technology Stack

### Backend Technologies

#### **Go (Golang)**
**Why Go?**
- **Performance**: Compiled language with excellent concurrency support
- **Simplicity**: Clean syntax and strong standard library
- **Deployment**: Single binary deployment simplifies operations
- **Ecosystem**: Rich ecosystem for web services and APIs

**Key Libraries:**
- **gqlgen**: Type-safe GraphQL server generation
- **GORM**: Object-relational mapping with PostgreSQL support
- **Chi**: Lightweight HTTP router for REST endpoints
- **JWT-go**: JSON Web Token implementation
- **bcrypt**: Secure password hashing

#### **GraphQL with gqlgen**
**Why GraphQL?**
- **Flexible Queries**: Clients request exactly the data they need
- **Strong Typing**: Schema-first development with type safety
- **Real-time Support**: Built-in subscription support for live updates
- **API Evolution**: Backward-compatible API changes

**Schema Design:**
- **Code-First**: Go structs define the schema
- **Resolver Pattern**: Clean separation of business logic
- **Custom Scalars**: DateTime, Upload types for rich data handling

#### **PostgreSQL Database**
**Why PostgreSQL?**
- **ACID Compliance**: Strong consistency guarantees
- **JSON Support**: JSONB for flexible audit log storage
- **Full-Text Search**: Built-in search capabilities for file metadata
- **Extensibility**: UUID generation, crypto functions

### Frontend Technologies

#### **React with TypeScript**
**Why React + TypeScript?**
- **Component Architecture**: Reusable, composable UI components
- **Type Safety**: Catch errors at compile time
- **Ecosystem**: Vast ecosystem of libraries and tools
- **Performance**: Virtual DOM and optimization techniques

#### **Apollo Client**
**Why Apollo Client?**
- **GraphQL Integration**: Seamless GraphQL query management
- **Caching**: Intelligent caching reduces server requests
- **Real-time**: WebSocket subscriptions for live updates
- **Developer Tools**: Excellent debugging and development experience

#### **Chakra UI**
**Why Chakra UI?**
- **Accessibility**: WCAG compliant components out of the box
- **Theming**: Consistent design system with dark mode support
- **Developer Experience**: Simple, composable component API
- **Customization**: Easy to customize and extend

### Infrastructure Technologies

#### **Docker & Docker Compose**
**Why Docker?**
- **Consistency**: Same environment across development, testing, and production
- **Isolation**: Services run in isolated containers
- **Scalability**: Easy horizontal scaling with container orchestration
- **Development**: Simplified setup for new developers

#### **nginx (Production)**
**Why nginx?**
- **Reverse Proxy**: Route requests to appropriate services
- **SSL Termination**: Handle HTTPS certificates and encryption
- **Static Assets**: Serve frontend assets efficiently
- **Load Balancing**: Distribute traffic across multiple instances

## Core Components

### Backend Components

#### 1. **Authentication Service** (`internal/auth`)
```go
// Core responsibilities:
// - Password hashing and verification
// - JWT token generation and validation
// - User session management
```

**Key Features:**
- bcrypt password hashing with configurable cost
- JWT tokens with 24-hour expiration
- Role-based claims embedded in tokens
- Middleware for request authentication

#### 2. **Storage Manager** (`internal/storage`)
```go
// Core responsibilities:
// - File storage with deduplication
// - Content hash calculation (SHA256)
// - MIME type validation
// - File system operations
```

**Key Features:**
- Content-addressable storage using SHA256 hashes
- Automatic deduplication based on file content
- MIME type validation for security
- Reference counting for garbage collection

#### 3. **Database Models** (`internal/db`)
```go
// Core responsibilities:
// - GORM model definitions
// - Database relationships
// - Data validation constraints
```

**Key Models:**
- **User**: Authentication and profile data
- **File**: File metadata with deduplication support
- **Folder**: Hierarchical organization
- **Sharing**: File and folder access control
- **AuditLog**: Immutable activity tracking

#### 4. **GraphQL Resolvers** (`internal/graph`)
```go
// Core responsibilities:
// - Business logic implementation
// - Data fetching and mutations
// - Authorization checks
// - Real-time subscriptions
```

**Resolver Categories:**
- **Query Resolvers**: Data fetching with filtering and pagination
- **Mutation Resolvers**: Data modifications with validation
- **Subscription Resolvers**: Real-time event streaming

#### 5. **Real-time Publisher** (`internal/realtime`)
```go
// Core responsibilities:
// - WebSocket connection management
// - Event broadcasting
// - Subscription filtering
// - User activity tracking
```

### Frontend Components

#### 1. **Authentication Context** (`utils/AuthContext`)
```typescript
// Core responsibilities:
// - User authentication state
// - JWT token management
// - Automatic token refresh
// - Protected route handling
```

#### 2. **Apollo Client Setup** (`graphql/client`)
```typescript
// Core responsibilities:
// - GraphQL query management
// - Caching configuration
// - WebSocket subscriptions
// - Error handling
```

#### 3. **UI Components** (`components/`)
```typescript
// Core component categories:
// - Layout components (Navbar, Layout)
// - File management (FilePreview, FileUpload)
// - Analytics (Charts, Statistics)
// - Real-time (ActivityFeed, Notifications)
```

#### 4. **Page Components** (`pages/`)
```typescript
// Core pages:
// - Dashboard: Overview and quick actions
// - Files: File management interface
// - Admin: System administration
// - Public: Public file access
```

## Database Design

### Schema Architecture

The database schema follows normalized design principles with strategic denormalization for performance:

#### **Core Entities**
1. **users**: User accounts and authentication
2. **files**: File metadata with deduplication
3. **folders**: Hierarchical organization
4. **file_contents**: Physical file storage management
5. **file_shares/folder_shares**: Access control
6. **tags/file_tags**: Categorization system
7. **audit_logs**: Activity tracking

#### **Key Relationships**
```sql
-- User ownership
users 1:n files
users 1:n folders

-- Hierarchical organization
folders 1:n folders (parent-child)
folders 1:n files

-- File deduplication
file_contents 1:n files (via content_hash)

-- Sharing system
files n:m users (via file_shares)
folders n:m users (via folder_shares)

-- Tagging system
files n:m tags (via file_tags)
```

### Design Decisions

#### **UUID Primary Keys**
**Rationale:**
- **Security**: Prevent enumeration attacks
- **Distribution**: No coordination needed for ID generation
- **Merging**: Easy to merge data from multiple sources

#### **Content Deduplication**
**Rationale:**
- **Storage Efficiency**: Reduce storage costs by eliminating duplicates
- **Performance**: Faster uploads for existing content
- **Integrity**: Content addressing ensures data integrity

#### **Audit Logging**
**Rationale:**
- **Compliance**: Meet regulatory requirements for data access tracking
- **Security**: Detect and investigate suspicious activities
- **Analytics**: Understand system usage patterns

### Indexing Strategy

```sql
-- Performance-critical indexes
CREATE INDEX users_email_idx ON users(email);
CREATE INDEX files_content_hash_idx ON files(content_hash);
CREATE INDEX files_owner_id_idx ON files(owner_id);
CREATE INDEX audit_logs_created_at_idx ON audit_logs(created_at);

-- Composite indexes for common queries
CREATE INDEX files_owner_folder_idx ON files(owner_id, folder_id);
CREATE INDEX audit_logs_user_action_idx ON audit_logs(user_id, action);
```

## API Design

### GraphQL Schema Philosophy

#### **Schema-First Design**
The GraphQL schema serves as the contract between frontend and backend:

```graphql
# Clear, self-documenting types
type File {
  id: ID!
  name: String!
  mimeType: String!
  size: Int!
  owner: User!
  folder: Folder
  isPublic: Boolean!
  tags: [Tag!]!
}

# Input types for mutations
input CreateFolderInput {
  name: String!
  parentId: ID
  isPublic: Boolean
}
```

#### **Query Optimization**
- **Pagination**: Cursor-based pagination for large datasets
- **Filtering**: Rich filtering capabilities for file searches
- **Field Selection**: Resolve only requested fields to minimize database queries

#### **Real-time Subscriptions**
```graphql
type Subscription {
  # Activity feed for dashboard
  activityFeed: ActivityEvent!
  
  # Personal notifications
  notifications(userId: ID!): NotificationEvent!
  
  # File changes for real-time updates
  fileUpdates: File!
}
```

### REST Endpoints

While GraphQL handles most operations, REST endpoints serve specific use cases:

#### **File Upload** (`POST /upload`)
**Why REST?**
- **Multipart Support**: Better handling of file uploads
- **Progress Tracking**: Upload progress callbacks
- **Browser Compatibility**: Universal browser support

#### **File Download** (`GET /download/{id}`)
**Why REST?**
- **Streaming**: Efficient large file streaming
- **Caching**: Browser and CDN caching support
- **Direct Links**: Shareable download URLs

## Security Architecture

### Authentication & Authorization

#### **JWT-Based Authentication**
```typescript
// Token structure
{
  "user_id": "uuid",
  "role": "admin|user|guest",
  "exp": timestamp,
  "iat": timestamp
}
```

**Security Features:**
- **Stateless**: No server-side session storage required
- **Expiration**: 24-hour token lifetime
- **Role Claims**: Authorization data embedded in token
- **Secret Rotation**: Environment-based signing keys

#### **Role-Based Access Control (RBAC)**

```typescript
// Permission matrix
const permissions = {
  admin: ['*'], // Full access
  user: ['file:read', 'file:write', 'file:share', 'folder:*'],
  guest: ['file:read'] // Read-only access to shared files
};
```

### Data Protection

#### **Password Security**
- **bcrypt Hashing**: Industry-standard password hashing
- **Cost Factor 10+**: Balance security and performance
- **Salt Generation**: Automatic salt generation per password

#### **File Security**
- **Content Validation**: MIME type verification
- **Size Limits**: Configurable file size restrictions
- **Access Controls**: Owner and sharing-based access

#### **Input Validation**
- **GraphQL Types**: Strong typing prevents many injection attacks
- **Sanitization**: Input sanitization at API boundaries
- **Rate Limiting**: Prevent abuse and DoS attacks

### Network Security

#### **HTTPS Everywhere**
- **TLS 1.2+**: Modern encryption standards
- **HSTS Headers**: Force HTTPS connections
- **Certificate Management**: Automated Let's Encrypt integration

#### **CORS Configuration**
```go
// Restrictive CORS policy
cors.New(cors.Options{
    AllowedOrigins:   []string{"https://app.filevault.com"},
    AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE"},
    AllowedHeaders:   []string{"Authorization", "Content-Type"},
    AllowCredentials: true,
})
```

## File Storage & Deduplication

### Storage Architecture

#### **Content-Addressable Storage**
```
File Upload Flow:
1. Calculate SHA256 hash of file content
2. Check if content already exists
3. If exists: Reference existing, increment ref count
4. If new: Store file with hash as filename
5. Create file record with metadata
```

#### **Storage Layout**
```
uploads/
├── ab/
│   └── abc123.../  # First 2 chars of hash for distribution
├── cd/
│   └── cdef456.../
└── ...
```

**Benefits:**
- **Deduplication**: Automatic elimination of duplicate files
- **Integrity**: Content hash verifies file integrity
- **Distribution**: Hash-based distribution across directories
- **Cleanup**: Reference counting enables garbage collection

### File Processing Pipeline

```go
// Upload processing
1. Receive multipart upload
2. Calculate content hash
3. Validate MIME type
4. Check storage quota
5. Store or reference existing file
6. Create database record
7. Update user storage usage
8. Publish activity event
```

### Performance Optimizations

#### **Streaming Processing**
- **Memory Efficiency**: Process files in chunks to handle large uploads
- **Hash Calculation**: Stream-based SHA256 computation
- **Progress Tracking**: Real-time upload progress updates

#### **Concurrent Operations**
- **Go Routines**: Parallel file processing
- **Connection Pooling**: Database connection optimization
- **Batch Operations**: Bulk database updates where possible

## Real-time Features

### WebSocket Architecture

#### **Connection Management**
```go
// Publisher manages WebSocket connections
type Publisher struct {
    clients    map[string]*websocket.Conn
    broadcasts chan []byte
    register   chan *Client
    unregister chan *Client
}
```

#### **Event Types**
```typescript
// Activity events for system-wide feed
type ActivityEvent = {
  type: 'FILE_UPLOADED' | 'FILE_DELETED' | 'FOLDER_CREATED';
  user: User;
  message: string;
  timestamp: DateTime;
};

// Personal notifications
type NotificationEvent = {
  type: 'FILE_SHARED' | 'STORAGE_QUOTA_WARNING';
  title: string;
  message: string;
  timestamp: DateTime;
};
```

### Subscription Filtering

#### **User-Specific Subscriptions**
- **Personal Notifications**: Filtered by user ID
- **File Updates**: Only files user has access to
- **Activity Feed**: Global events with privacy filtering

#### **Performance Considerations**
- **Connection Limits**: Per-user connection limits
- **Message Queuing**: Buffer messages for disconnected clients
- **Heartbeat**: Keep-alive mechanism for connection health

## Performance Considerations

### Database Performance

#### **Query Optimization**
```sql
-- Efficient file listing with joins
SELECT f.*, u.name as owner_name, fo.name as folder_name
FROM files f
JOIN users u ON f.owner_id = u.id
LEFT JOIN folders fo ON f.folder_id = fo.id
WHERE f.owner_id = $1 OR f.id IN (
    SELECT file_id FROM file_shares WHERE user_id = $1
)
ORDER BY f.created_at DESC
LIMIT 20;
```

#### **Connection Pooling**
```go
// Database connection configuration
db.SetMaxOpenConns(25)
db.SetMaxIdleConns(5)
db.SetConnMaxLifetime(5 * time.Minute)
```

### Frontend Performance

#### **Apollo Client Caching**
```typescript
// Intelligent caching configuration
const cache = new InMemoryCache({
  typePolicies: {
    File: {
      fields: {
        downloadCount: {
          merge: false // Always use fresh data
        }
      }
    }
  }
});
```

#### **Code Splitting**
```typescript
// Lazy loading for admin features
const AdminPage = React.lazy(() => import('./pages/AdminPage'));
```

#### **Image Optimization**
- **Thumbnail Generation**: Server-side thumbnail creation
- **Lazy Loading**: Load images only when visible
- **Format Optimization**: WebP with fallbacks

### Caching Strategy

#### **Client-Side Caching**
- **Apollo Cache**: Normalized GraphQL query caching
- **Browser Cache**: Static asset caching with versioning
- **Local Storage**: User preferences and settings

#### **Server-Side Caching**
- **Query Result Caching**: Cache expensive aggregation queries
- **Static File Serving**: nginx for static asset delivery
- **CDN Integration**: CloudFront/CloudFlare for global delivery

## Scalability & Deployment

### Horizontal Scaling

#### **Stateless Design**
- **JWT Authentication**: No server-side session state
- **Shared Database**: All instances share the same database
- **File Storage**: Shared storage accessible by all instances

#### **Load Balancing**
```nginx
upstream backend {
    server app1:8080;
    server app2:8080;
    server app3:8080;
}
```

### Database Scaling

#### **Read Replicas**
```go
// Database routing for read/write separation
func (r *Resolver) GetFiles(ctx context.Context) ([]*File, error) {
    // Use read replica for queries
    return r.readDB.Find(&files).Error
}

func (r *Resolver) CreateFile(ctx context.Context) (*File, error) {
    // Use primary for writes
    return r.writeDB.Create(&file).Error
}
```

#### **Partitioning Strategy**
- **Time-based**: Partition audit logs by date
- **Hash-based**: Partition files by owner ID
- **Archive Strategy**: Move old data to cheaper storage

### Container Orchestration

#### **Kubernetes Deployment**
```yaml
# Production deployment configuration
apiVersion: apps/v1
kind: Deployment
metadata:
  name: filevault-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: filevault-backend
  template:
    spec:
      containers:
      - name: backend
        image: filevault/backend:latest
        env:
        - name: DB_HOST
          value: postgres-service
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: filevault-secrets
              key: jwt-secret
```

#### **Health Checks**
```go
// Health check endpoint
func healthHandler(w http.ResponseWriter, r *http.Request) {
    status := map[string]interface{}{
        "status":   "healthy",
        "database": checkDatabase(),
        "storage":  checkStorage(),
        "version":  os.Getenv("VERSION"),
    }
    json.NewEncoder(w).Encode(status)
}
```

### Monitoring & Observability

#### **Metrics Collection**
- **Prometheus**: Application and system metrics
- **Grafana**: Visualization dashboards
- **Custom Metrics**: Business-specific measurements

#### **Logging Strategy**
```go
// Structured logging with context
log.WithFields(log.Fields{
    "user_id":    userID,
    "file_id":    fileID,
    "action":     "file_upload",
    "file_size":  size,
    "duration":   duration,
}).Info("File uploaded successfully")
```

#### **Error Tracking**
- **Sentry Integration**: Real-time error reporting
- **Error Context**: Rich context for debugging
- **Performance Monitoring**: Transaction tracing

## Design Decisions & Trade-offs

### Technology Choices

#### **Go vs Node.js**
**Decision: Go**

**Pros:**
- Better performance for file operations
- Strong typing and compile-time error checking
- Excellent concurrency support
- Single binary deployment

**Cons:**
- Smaller ecosystem compared to Node.js
- Learning curve for developers new to Go

#### **GraphQL vs REST**
**Decision: Hybrid (GraphQL + REST)**

**Pros:**
- GraphQL: Flexible queries, strong typing, real-time support
- REST: Better for file operations, caching, browser compatibility

**Cons:**
- Increased complexity with two API styles
- Additional tooling and documentation needed

#### **PostgreSQL vs NoSQL**
**Decision: PostgreSQL**

**Pros:**
- ACID transactions for data consistency
- Rich query capabilities with SQL
- JSON support for flexible data
- Mature ecosystem and tooling

**Cons:**
- More complex to scale horizontally
- Fixed schema requires migrations

### Architecture Trade-offs

#### **Monolith vs Microservices**
**Decision: Modular Monolith (Microservice-Ready)**

**Rationale:**
- Simpler deployment and operations
- Easier development and debugging
- Clear module boundaries for future splitting
- ACID transactions across modules

**Future Path:**
- Extract authentication service
- Separate analytics service
- Independent file processing service

#### **File Storage: Database vs File System**
**Decision: File System with Database Metadata**

**Rationale:**
- Better performance for large files
- Reduced database storage costs
- Easier backup and replication of files
- Standard file system tools and utilities

**Considerations:**
- Two-phase commits for consistency
- Backup coordination between DB and files
- Potential for orphaned files

#### **Real-time: Polling vs WebSockets**
**Decision: WebSockets with Fallback**

**Rationale:**
- True real-time updates for better UX
- Reduced server load compared to polling
- Better for collaborative features

**Considerations:**
- More complex connection management
- Firewall and proxy compatibility issues
- Fallback to polling for reliability

### Performance Trade-offs

#### **Normalization vs Denormalization**
**Decision: Normalized with Strategic Denormalization**

**Strategy:**
- Fully normalized core schema
- Denormalized audit logs for performance
- Computed fields for expensive aggregations
- Read replicas for analytical queries

#### **Consistency vs Performance**
**Decision: Strong Consistency with Performance Optimizations**

**Strategy:**
- ACID transactions for critical operations
- Eventually consistent analytics data
- Optimistic UI updates with conflict resolution
- Caching for read-heavy operations

### Security Trade-offs

#### **Security vs Usability**
**Decision: Security First with UX Considerations**

**Implementations:**
- Strong password requirements with user guidance
- Two-factor authentication (future feature)
- Audit logging for all actions
- Graceful security error messages

#### **JWT vs Sessions**
**Decision: JWT with Refresh Tokens (Future)**

**Current State:**
- Simple JWT with 24-hour expiration
- Stateless authentication for scaling

**Future Enhancements:**
- Refresh token rotation
- Token blacklisting capability
- Shorter access token lifetime

## Future Considerations

### Planned Enhancements

#### **Advanced Security**
- Two-factor authentication
- File encryption at rest
- Advanced threat detection
- SSO integration (SAML, OAuth)

#### **Collaboration Features**
- Real-time collaborative editing
- Comment and annotation system
- Advanced sharing permissions
- Team and organization management

#### **AI/ML Integration**
- Automatic file categorization
- Duplicate detection improvements
- Content-based search
- Usage pattern analysis

#### **Mobile Support**
- React Native mobile app
- Offline synchronization
- Camera integration for uploads
- Push notifications

### Scalability Roadmap

#### **Phase 1: Vertical Scaling**
- Database optimization and tuning
- Enhanced caching strategies
- Performance monitoring and alerting

#### **Phase 2: Horizontal Scaling**
- Load balancer implementation
- Database read replicas
- CDN integration for file delivery

#### **Phase 3: Microservices**
- Service extraction and decomposition
- Event-driven architecture
- Service mesh implementation

#### **Phase 4: Global Scale**
- Multi-region deployment
- Global load balancing
- Edge computing integration

This architecture provides a solid foundation for a secure, scalable, and maintainable file storage system while maintaining flexibility for future enhancements and scaling requirements.