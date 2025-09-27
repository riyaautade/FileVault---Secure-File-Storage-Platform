# FileVault API Documentation

This document provides comprehensive API documentation for the FileVault system, including GraphQL schema, REST endpoints, authentication, and usage examples.

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [GraphQL API](#graphql-api)
4. [REST Endpoints](#rest-endpoints)
5. [WebSocket Subscriptions](#websocket-subscriptions)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)
8. [Examples](#examples)

## Overview

FileVault provides a hybrid API approach:
- **GraphQL** for data queries and mutations
- **REST** for file uploads/downloads and simple operations
- **WebSocket** for real-time subscriptions

### Base URLs
- **Development**: `http://localhost:8080`
- **Production**: `https://api.your-domain.com`

### API Endpoints
- **GraphQL**: `/graphql`
- **File Operations**: `/upload`, `/download/{id}`
- **Health Check**: `/health`

## Authentication

FileVault uses JWT (JSON Web Tokens) for authentication.

### Authentication Flow

#### 1. Sign Up
```graphql
mutation SignUp {
  signup(input: {
    email: "user@example.com"
    password: "securePassword123"
    name: "John Doe"
  }) {
    token
    user {
      id
      email
      name
      role
    }
  }
}
```

#### 2. Login
```graphql
mutation Login {
  login(email: "user@example.com", password: "securePassword123") {
    token
    user {
      id
      email
      name
      role
      storageUsed
      storageQuota
    }
  }
}
```

#### 3. Using JWT Token
Include the JWT token in the `Authorization` header for all authenticated requests:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### User Roles
- **admin**: Full system access, user management, analytics
- **user**: Standard file operations, sharing within permissions
- **guest**: Limited read-only access to shared resources

## GraphQL API

### Schema Definition Language (SDL)

```graphql
# Scalar types
scalar DateTime
scalar Upload

# Core Types
type User {
  id: ID!
  email: String!
  name: String!
  role: String!
  storageUsed: Int!
  storageQuota: Int!
  createdAt: DateTime!
  updatedAt: DateTime!
  files: [File!]!
  folders: [Folder!]!
}

type File {
  id: ID!
  name: String!
  contentHash: String!
  mimeType: String!
  size: Int!
  owner: User!
  folder: Folder
  isPublic: Boolean!
  downloadCount: Int!
  createdAt: DateTime!
  updatedAt: DateTime!
  tags: [Tag!]!
}

type Folder {
  id: ID!
  name: String!
  owner: User!
  parent: Folder
  isPublic: Boolean!
  files: [File!]!
  subfolders: [Folder!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type FileShare {
  id: ID!
  file: File!
  user: User!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type FolderShare {
  id: ID!
  folder: Folder!
  user: User!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Tag {
  id: ID!
  name: String!
  files: [File!]!
  createdAt: DateTime!
}

type AuditLog {
  id: ID!
  user: User
  action: String!
  resourceType: String!
  resourceId: ID!
  details: String
  createdAt: DateTime!
}

# Analytics Types
type StorageStats {
  totalStorage: Int!
  originalStorage: Int!
  savedStorage: Int!
  savingsPercentage: Float!
}

type UploadTrend {
  date: String!
  count: Int!
  size: Int!
}

type UserActivity {
  userId: ID!
  userName: String!
  userEmail: String!
  fileCount: Int!
  totalSize: Int!
  lastActivity: DateTime
  sharingCount: Int!
}

type FileTypeStats {
  mimeType: String!
  count: Int!
  totalSize: Int!
  percentage: Float!
}

type SharingStats {
  totalShares: Int!
  publicFiles: Int!
  publicFolders: Int!
  userShares: Int!
  mostSharedFiles: [File!]!
  mostSharedFolders: [Folder!]!
}

type AnalyticsSummary {
  uploadTrends: [UploadTrend!]!
  userActivity: [UserActivity!]!
  fileTypeStats: [FileTypeStats!]!
  sharingStats: SharingStats!
  storageStats: StorageStats!
}

type AuthPayload {
  token: String!
  user: User!
}

# Input Types
input FileFilter {
  filename: String
  mimeType: String
  minSize: Int
  maxSize: Int
  fromDate: DateTime
  toDate: DateTime
  tags: [String!]
  uploader: String
}

input CreateUserInput {
  email: String!
  password: String!
  name: String!
}

input UpdateUserInput {
  name: String
  password: String
  storageQuota: Int
  role: String
}

input CreateFolderInput {
  name: String!
  parentId: ID
  isPublic: Boolean
}

input UpdateFolderInput {
  name: String
  parentId: ID
  isPublic: Boolean
}

# Real-time Event Types
enum ActivityType {
  FILE_UPLOADED
  FILE_DELETED
  FOLDER_CREATED
  FOLDER_DELETED
  FILE_SHARED
  FOLDER_SHARED
  USER_JOINED
  USER_LEFT
}

type ActivityEvent {
  id: ID!
  type: ActivityType!
  user: User!
  message: String!
  data: String
  timestamp: DateTime!
}

type NotificationEvent {
  id: ID!
  userId: ID!
  type: String!
  title: String!
  message: String!
  data: String
  timestamp: DateTime!
}

# Root Types
type Query {
  # Authentication
  me: User!
  
  # Users
  user(id: ID!): User
  users: [User!]!
  
  # Files
  file(id: ID!): File
  files(filter: FileFilter, first: Int, after: String): [File!]!
  
  # Folders
  folder(id: ID!): Folder
  folders: [Folder!]!
  publicFolder(id: ID!): Folder
  
  # Sharing
  sharedFiles: [File!]!
  sharedFolders: [Folder!]!
  
  # Tags
  tags: [Tag!]!
  
  # Analytics (Admin only)
  storageStats: StorageStats!
  analyticsSummary(days: Int): AnalyticsSummary!
  uploadTrends(days: Int): [UploadTrend!]!
  userActivity: [UserActivity!]!
  fileTypeStats: [FileTypeStats!]!
  sharingStats: SharingStats!
  
  # Audit logs (Admin only)
  auditLogs(resourceId: ID): [AuditLog!]!
}

type Mutation {
  # Authentication
  signup(input: CreateUserInput!): AuthPayload!
  login(email: String!, password: String!): AuthPayload!
  
  # User Management
  updateUser(id: ID!, input: UpdateUserInput!): User!
  deleteUser(id: ID!): Boolean!
  
  # File Operations
  uploadFile(file: Upload!, folderId: ID, isPublic: Boolean): File!
  updateFile(id: ID!, name: String, isPublic: Boolean): File!
  deleteFile(id: ID!): Boolean!
  
  # File Sharing
  shareFile(id: ID!, userId: ID!): FileShare!
  unshareFile(id: ID!, userId: ID!): Boolean!
  
  # Folder Operations
  createFolder(input: CreateFolderInput!): Folder!
  updateFolder(id: ID!, input: UpdateFolderInput!): Folder!
  deleteFolder(id: ID!): Boolean!
  
  # Folder Sharing
  shareFolder(id: ID!, userId: ID!): FolderShare!
  unshareFolder(id: ID!, userId: ID!): Boolean!
  
  # Tag Management
  createTag(name: String!): Tag!
  addTagToFile(fileId: ID!, tagId: ID!): File!
  removeTagFromFile(fileId: ID!, tagId: ID!): File!
}

type Subscription {
  # Real-time activity feed
  activityFeed: ActivityEvent!
  
  # Personal notifications
  notifications(userId: ID!): NotificationEvent!
  
  # File updates
  fileUpdates: File!
  
  # Folder updates
  folderUpdates: Folder!
  
  # Analytics updates (Admin only)
  analyticsUpdates: AnalyticsSummary!
  
  # User activity status
  userActivity: UserActivity!
}
```

### Common Queries

#### Get Current User Info
```graphql
query Me {
  me {
    id
    email
    name
    role
    storageUsed
    storageQuota
    createdAt
  }
}
```

#### List Files with Filters
```graphql
query GetFiles($filter: FileFilter, $first: Int) {
  files(filter: $filter, first: $first) {
    id
    name
    mimeType
    size
    isPublic
    downloadCount
    createdAt
    owner {
      name
      email
    }
    folder {
      name
    }
    tags {
      name
    }
  }
}
```

#### Get Folder Hierarchy
```graphql
query GetFolder($id: ID!) {
  folder(id: $id) {
    id
    name
    isPublic
    files {
      id
      name
      mimeType
      size
      createdAt
    }
    subfolders {
      id
      name
      isPublic
    }
    parent {
      id
      name
    }
    owner {
      name
    }
  }
}
```

### Common Mutations

#### Upload File (Metadata Only)
```graphql
mutation UploadFile($file: Upload!, $folderId: ID, $isPublic: Boolean) {
  uploadFile(file: $file, folderId: $folderId, isPublic: $isPublic) {
    id
    name
    mimeType
    size
    contentHash
    createdAt
    owner {
      name
    }
  }
}
```

#### Create Folder
```graphql
mutation CreateFolder($input: CreateFolderInput!) {
  createFolder(input: $input) {
    id
    name
    isPublic
    owner {
      name
    }
    parent {
      name
    }
  }
}
```

#### Share File
```graphql
mutation ShareFile($fileId: ID!, $userId: ID!) {
  shareFile(id: $fileId, userId: $userId) {
    id
    file {
      name
    }
    user {
      email
    }
    createdAt
  }
}
```

## REST Endpoints

### File Upload
Handles multipart file uploads with metadata.

```http
POST /upload
Content-Type: multipart/form-data
Authorization: Bearer {token}

# Form fields:
# file: Binary file data
# folderId: (optional) UUID of parent folder
# isPublic: (optional) Boolean for public access
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "document.pdf",
  "mimeType": "application/pdf",
  "size": 1024000,
  "contentHash": "abc123...",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### File Download
Downloads file content by ID.

```http
GET /download/{fileId}
Authorization: Bearer {token} # Required for private files

# Query parameters:
# preview: (optional) true for inline display
# thumbnail: (optional) true for image thumbnails
```

**Response:**
```http
Content-Type: {original-mime-type}
Content-Disposition: attachment; filename="original-name.ext"
Content-Length: {file-size}

{binary-file-data}
```

### Public File Access
Downloads public files without authentication.

```http
GET /public/file/{fileId}

# No authentication required for public files
```

### Health Check
System health and status endpoint.

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "storage": "available",
  "version": "1.0.0",
  "uptime": 86400
}
```

## WebSocket Subscriptions

### Connection Setup
Connect to WebSocket endpoint for real-time subscriptions:

```javascript
const wsClient = new ApolloClient({
  uri: 'ws://localhost:8080/graphql',
  wsUri: 'ws://localhost:8080/graphql',
  options: {
    connectionParams: {
      Authorization: `Bearer ${token}`
    }
  }
});
```

### Activity Feed Subscription
```graphql
subscription ActivityFeed {
  activityFeed {
    id
    type
    user {
      name
    }
    message
    timestamp
  }
}
```

### Personal Notifications
```graphql
subscription PersonalNotifications($userId: ID!) {
  notifications(userId: $userId) {
    id
    type
    title
    message
    timestamp
  }
}
```

### File Updates
```graphql
subscription FileUpdates {
  fileUpdates {
    id
    name
    downloadCount
    updatedAt
  }
}
```

## Error Handling

### GraphQL Errors
GraphQL returns structured errors in the response:

```json
{
  "data": null,
  "errors": [
    {
      "message": "File not found",
      "extensions": {
        "code": "NOT_FOUND",
        "fileId": "invalid-id"
      },
      "path": ["file"]
    }
  ]
}
```

### Common Error Codes
- `UNAUTHENTICATED`: Missing or invalid authentication
- `UNAUTHORIZED`: Insufficient permissions
- `NOT_FOUND`: Resource doesn't exist
- `VALIDATION_ERROR`: Invalid input data
- `STORAGE_QUOTA_EXCEEDED`: User storage limit reached
- `FILE_TOO_LARGE`: File exceeds size limits
- `DUPLICATE_FILE`: File already exists (by hash)

### REST API Errors
REST endpoints return standard HTTP status codes:

```json
{
  "error": {
    "code": "FILE_NOT_FOUND",
    "message": "The requested file does not exist or you don't have access",
    "details": {
      "fileId": "invalid-id"
    }
  }
}
```

### HTTP Status Codes
- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `413 Payload Too Large`: File too large
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

## Rate Limiting

FileVault implements rate limiting to prevent abuse:

### Limits
- **GraphQL Queries**: 100 requests per minute per user
- **File Uploads**: 10 uploads per minute per user  
- **File Downloads**: 50 downloads per minute per user
- **Authentication**: 5 login attempts per minute per IP

### Headers
Rate limit information is returned in response headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
X-RateLimit-Retry-After: 60
```

### Rate Limit Exceeded Response
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 60
  }
}
```

## Examples

### Complete File Upload Flow

#### 1. Upload File via REST
```bash
curl -X POST \
  -H "Authorization: Bearer {token}" \
  -F "file=@document.pdf" \
  -F "isPublic=false" \
  http://localhost:8080/upload
```

#### 2. Add Tags via GraphQL
```graphql
mutation AddTags {
  addTagToFile(
    fileId: "uploaded-file-id"
    tagId: "document-tag-id"
  ) {
    id
    tags {
      name
    }
  }
}
```

#### 3. Share with User
```graphql
mutation ShareFile {
  shareFile(
    id: "uploaded-file-id"
    userId: "recipient-user-id"
  ) {
    id
    user {
      email
    }
  }
}
```

### Advanced Search
```graphql
query AdvancedSearch {
  files(
    filter: {
      mimeType: "application/pdf"
      minSize: 1000000  # 1MB
      maxSize: 10000000 # 10MB
      fromDate: "2024-01-01T00:00:00Z"
      tags: ["important", "work"]
    }
    first: 20
  ) {
    id
    name
    size
    createdAt
    tags {
      name
    }
  }
}
```

### Analytics Dashboard (Admin)
```graphql
query AdminAnalytics {
  analyticsSummary(days: 30) {
    storageStats {
      totalStorage
      savedStorage
      savingsPercentage
    }
    uploadTrends {
      date
      count
      size
    }
    userActivity {
      userName
      fileCount
      totalSize
      lastActivity
    }
    fileTypeStats {
      mimeType
      count
      percentage
    }
  }
}
```

### Real-time Activity Monitor
```javascript
// Subscribe to activity feed
const subscription = wsClient.subscribe({
  query: gql`
    subscription {
      activityFeed {
        type
        user { name }
        message
        timestamp
      }
    }
  `
}).subscribe({
  next: (data) => {
    console.log('New activity:', data.activityFeed);
    // Update UI with new activity
  },
  error: (err) => console.error('Subscription error:', err)
});
```

## SDK Examples

### JavaScript/TypeScript Client
```typescript
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// Create authenticated Apollo Client
const httpLink = createHttpLink({
  uri: 'http://localhost:8080/graphql',
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

// Usage example
import { gql } from '@apollo/client';

const GET_FILES = gql`
  query GetFiles {
    files {
      id
      name
      size
      createdAt
    }
  }
`;

// In React component
const { data, loading, error } = useQuery(GET_FILES);
```

### cURL Examples

#### Authentication
```bash
# Login
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { login(email: \"user@example.com\", password: \"password\") { token user { name } } }"
  }' \
  http://localhost:8080/graphql
```

#### File Operations
```bash
# Upload file
curl -X POST \
  -H "Authorization: Bearer {token}" \
  -F "file=@example.jpg" \
  -F "isPublic=true" \
  http://localhost:8080/upload

# Download file
curl -H "Authorization: Bearer {token}" \
  http://localhost:8080/download/{fileId} \
  -o downloaded-file.jpg
```

## OpenAPI Specification

```yaml
openapi: 3.0.3
info:
  title: FileVault API
  description: Secure file storage and sharing system
  version: 1.0.0
  contact:
    email: support@filevault.com

servers:
  - url: http://localhost:8080
    description: Development server
  - url: https://api.filevault.com  
    description: Production server

paths:
  /upload:
    post:
      summary: Upload file
      security:
        - bearerAuth: []
      requestBody:
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                file:
                  type: string
                  format: binary
                folderId:
                  type: string
                  format: uuid
                isPublic:
                  type: boolean
              required:
                - file
      responses:
        '201':
          description: File uploaded successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/File'

  /download/{fileId}:
    get:
      summary: Download file
      parameters:
        - name: fileId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: File content
          content:
            application/octet-stream:
              schema:
                type: string
                format: binary

  /health:
    get:
      summary: Health check
      responses:
        '200':
          description: System status
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HealthStatus'

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    File:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        mimeType:
          type: string
        size:
          type: integer
          format: int64
        contentHash:
          type: string
        createdAt:
          type: string
          format: date-time
      required:
        - id
        - name
        - mimeType
        - size

    HealthStatus:
      type: object
      properties:
        status:
          type: string
          enum: [healthy, unhealthy]
        database:
          type: string
        storage:
          type: string
        version:
          type: string
        uptime:
          type: integer
```

This comprehensive API documentation covers all aspects of the FileVault API, providing developers with the information needed to integrate with the system effectively.