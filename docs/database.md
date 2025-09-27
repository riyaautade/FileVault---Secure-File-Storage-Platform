# FileVault Database Schema

This document provides a comprehensive overview of the FileVault database schema, including all tables, relationships, indexes, and constraints.

## Database Overview

FileVault uses PostgreSQL as its primary database with UUID-based primary keys for better security and scalability. The schema supports file deduplication, hierarchical folder structures, user management with role-based access control, and comprehensive audit logging.

### Key Features
- **File Deduplication**: Uses SHA256 content hashing to avoid storing duplicate files
- **Hierarchical Folders**: Supports nested folder structures with parent-child relationships
- **Role-Based Access Control**: Admin, user, and guest roles with granular permissions
- **Sharing System**: File and folder sharing between users
- **Audit Logging**: Comprehensive activity tracking for security and compliance
- **Tag System**: File categorization and search optimization

## Database Configuration

```sql
-- Required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- UUID generation functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";    -- Cryptographic functions

-- Timezone configuration
SET timezone = 'UTC';
```

## Core Tables

### users
**Purpose**: Stores user account information, authentication data, and storage quotas.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique user identifier |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | User email address (login) |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| `name` | VARCHAR(255) | NOT NULL | Display name |
| `role` | VARCHAR(20) | NOT NULL, DEFAULT 'user' | User role (admin, user, guest) |
| `storage_used` | BIGINT | DEFAULT 0 | Current storage usage in bytes |
| `storage_quota` | BIGINT | DEFAULT 10485760 | Storage limit in bytes (10MB default) |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation date |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last modification date |

**Constraints**:
```sql
CHECK (role IN ('admin', 'user', 'guest'))
CHECK (storage_used >= 0)
CHECK (storage_quota > 0)
```

**Indexes**:
- `users_email_idx` ON `email`
- `idx_users_role` ON `role`

### files
**Purpose**: Stores file metadata and references to physical file content.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique file identifier |
| `name` | VARCHAR(255) | NOT NULL | File name (can be different from original) |
| `content_hash` | VARCHAR(64) | NOT NULL | SHA256 hash of file content |
| `mime_type` | VARCHAR(127) | NOT NULL | MIME type (e.g., image/jpeg) |
| `size` | BIGINT | NOT NULL | File size in bytes |
| `owner_id` | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | File owner |
| `folder_id` | UUID | REFERENCES folders(id) ON DELETE SET NULL | Parent folder (NULL for root) |
| `is_public` | BOOLEAN | DEFAULT false | Public access flag |
| `download_count` | INT | DEFAULT 0 | Number of downloads |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Upload date |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last modification date |

**Constraints**:
```sql
CHECK (size > 0)
CHECK (download_count >= 0)
CHECK (content_hash ~ '^[a-fA-F0-9]{64}$')  -- Valid SHA256 hash
```

**Indexes**:
- `files_content_hash_idx` ON `content_hash`
- `files_owner_id_idx` ON `owner_id`
- `files_folder_id_idx` ON `folder_id`
- `idx_files_file_type` ON `mime_type`

### folders
**Purpose**: Manages hierarchical folder structure for file organization.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique folder identifier |
| `name` | VARCHAR(255) | NOT NULL | Folder name |
| `owner_id` | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | Folder owner |
| `parent_id` | UUID | REFERENCES folders(id) ON DELETE CASCADE | Parent folder (NULL for root) |
| `is_public` | BOOLEAN | DEFAULT false | Public access flag |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation date |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last modification date |

**Constraints**:
```sql
-- Prevent circular references (implemented in application logic)
CHECK (parent_id != id)
```

**Indexes**:
- `folders_owner_id_idx` ON `owner_id`
- `folders_parent_id_idx` ON `parent_id`

### file_contents
**Purpose**: Manages physical file storage and deduplication.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `content_hash` | VARCHAR(64) | PRIMARY KEY | SHA256 hash (unique per content) |
| `path` | VARCHAR(511) | NOT NULL | File system path to stored file |
| `reference_count` | INT | DEFAULT 1 | Number of files referencing this content |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | First storage date |

**Constraints**:
```sql
CHECK (reference_count > 0)
CHECK (content_hash ~ '^[a-fA-F0-9]{64}$')
```

## Sharing System

### file_shares
**Purpose**: Manages file sharing permissions between users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique share identifier |
| `file_id` | UUID | NOT NULL, REFERENCES files(id) ON DELETE CASCADE | Shared file |
| `user_id` | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | User with access |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Share creation date |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last modification date |

**Constraints**:
```sql
UNIQUE(file_id, user_id)  -- Prevent duplicate shares
```

**Indexes**:
- `file_shares_user_id_idx` ON `user_id`
- `file_shares_file_id_idx` ON `file_id`

### folder_shares
**Purpose**: Manages folder sharing permissions between users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique share identifier |
| `folder_id` | UUID | NOT NULL, REFERENCES folders(id) ON DELETE CASCADE | Shared folder |
| `user_id` | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | User with access |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Share creation date |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last modification date |

**Constraints**:
```sql
UNIQUE(folder_id, user_id)  -- Prevent duplicate shares
```

**Indexes**:
- `folder_shares_user_id_idx` ON `user_id`
- `folder_shares_folder_id_idx` ON `folder_id`

## Tag System

### tags
**Purpose**: Stores available tags for file categorization.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique tag identifier |
| `name` | VARCHAR(50) | NOT NULL, UNIQUE | Tag name (case-sensitive) |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Tag creation date |

**Constraints**:
```sql
CHECK (length(trim(name)) > 0)  -- Non-empty tag names
```

### file_tags
**Purpose**: Many-to-many relationship between files and tags.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `file_id` | UUID | REFERENCES files(id) ON DELETE CASCADE | Tagged file |
| `tag_id` | UUID | REFERENCES tags(id) ON DELETE CASCADE | Applied tag |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Tag application date |

**Constraints**:
```sql
PRIMARY KEY (file_id, tag_id)  -- Composite primary key
```

## Audit and Logging

### audit_logs
**Purpose**: Comprehensive activity logging for security and compliance.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique log entry identifier |
| `user_id` | UUID | REFERENCES users(id) ON DELETE SET NULL | User who performed action |
| `action` | VARCHAR(50) | NOT NULL | Action type (CREATE, UPDATE, DELETE, etc.) |
| `resource_type` | VARCHAR(50) | NOT NULL | Resource type (FILE, FOLDER, USER, etc.) |
| `resource_id` | UUID | NOT NULL | ID of affected resource |
| `details` | JSONB | | Additional action details |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Action timestamp |

**Common Actions**:
- `FILE_UPLOADED`, `FILE_DOWNLOADED`, `FILE_DELETED`
- `FOLDER_CREATED`, `FOLDER_DELETED`
- `USER_LOGIN`, `USER_LOGOUT`
- `SHARE_CREATED`, `SHARE_REMOVED`

**Indexes**:
- `audit_logs_user_id_idx` ON `user_id`
- `audit_logs_resource_id_idx` ON `resource_id`
- `idx_audit_logs_action` ON `action`
- `idx_audit_logs_resource_type` ON `resource_type`
- `idx_audit_logs_created_at` ON `created_at`

## Database Functions and Triggers

### Update Timestamp Function
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';
```

### Automatic Timestamp Updates
```sql
-- Applied to all tables with updated_at columns
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_files_updated_at
    BEFORE UPDATE ON files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_folders_updated_at
    BEFORE UPDATE ON folders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ... (similar triggers for other tables)
```

## Data Relationships

### Entity Relationship Diagram (Textual)

```
users (1) ─────── (n) files
users (1) ─────── (n) folders
users (1) ─────── (n) file_shares
users (1) ─────── (n) folder_shares
users (1) ─────── (n) audit_logs

files (n) ─────── (1) file_contents [via content_hash]
files (1) ─────── (n) file_shares
files (1) ─────── (n) file_tags
files (n) ─────── (1) folders [optional]

folders (1) ─────── (n) folders [parent-child]
folders (1) ─────── (n) files
folders (1) ─────── (n) folder_shares

tags (1) ─────── (n) file_tags
```

### Key Relationships
1. **User Ownership**: Users own files and folders
2. **File Deduplication**: Multiple files can reference same file_contents
3. **Folder Hierarchy**: Folders can contain subfolders (self-referencing)
4. **Sharing**: Files and folders can be shared with multiple users
5. **Tagging**: Files can have multiple tags (many-to-many)

## Default Data

### System Users
The database is initialized with default users for testing and administration:

```sql
-- Admin user (password: admin123)
INSERT INTO users (username, email, password_hash, role) VALUES (
    'admin', 'admin@filevault.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'admin'
);

-- Regular user (password: user123)  
INSERT INTO users (username, email, password_hash, role) VALUES (
    'user', 'user@filevault.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'user'
);
```

## Performance Considerations

### Indexing Strategy
- **Primary keys**: Automatic B-tree indexes on all UUID primary keys
- **Foreign keys**: Indexes on all foreign key columns for fast joins
- **Search fields**: Indexes on frequently searched columns (email, content_hash)
- **Composite indexes**: Consider adding for common query patterns

### Query Optimization
```sql
-- Example: Find user's files with folder names
EXPLAIN ANALYZE
SELECT f.name, f.size, fo.name AS folder_name
FROM files f
LEFT JOIN folders fo ON f.folder_id = fo.id
WHERE f.owner_id = $1;

-- Example: File deduplication statistics
SELECT content_hash, reference_count, 
       reference_count * (SELECT AVG(size) FROM files WHERE content_hash = fc.content_hash) as space_saved
FROM file_contents fc
WHERE reference_count > 1;
```

### Maintenance Tasks
```sql
-- Regular maintenance
VACUUM ANALYZE;

-- Update table statistics
ANALYZE users, files, folders, file_contents;

-- Check for unused file contents (orphaned files)
SELECT fc.content_hash, fc.path 
FROM file_contents fc 
LEFT JOIN files f ON fc.content_hash = f.content_hash 
WHERE f.content_hash IS NULL;
```

## Migration Scripts

Database migrations are managed using golang-migrate and located in `/backend/migrations/`:

- `000001_init_schema.up.sql` - Initial schema creation
- `000001_init_schema.down.sql` - Schema rollback

### Running Migrations
```bash
# Apply all migrations
migrate -path migrations -database "postgres://user:pass@host/db?sslmode=disable" up

# Rollback one migration
migrate -path migrations -database "postgres://user:pass@host/db?sslmode=disable" down 1

# Check migration status
migrate -path migrations -database "postgres://user:pass@host/db?sslmode=disable" version
```

## Security Considerations

### Data Protection
- **Password Hashing**: All passwords are hashed using bcrypt with cost factor 10+
- **UUID Usage**: UUIDs prevent enumeration attacks on resource IDs
- **Soft Deletes**: Consider implementing soft deletes for sensitive data
- **Encryption**: File contents can be encrypted before storage (implement in application)

### Access Control
- **Row Level Security**: Consider implementing RLS for multi-tenant scenarios
- **Audit Logging**: All significant actions are logged with user attribution
- **Data Retention**: Implement policies for audit log and file retention

### Backup and Recovery
```sql
-- Regular backup
pg_dump -U postgres filevault > backup_$(date +%Y%m%d).sql

-- Point-in-time recovery setup
ALTER SYSTEM SET wal_level = replica;
ALTER SYSTEM SET archive_mode = on;
ALTER SYSTEM SET archive_command = 'cp %p /var/lib/postgresql/archive/%f';
```

## Monitoring Queries

### System Health
```sql
-- Database size
SELECT pg_size_pretty(pg_database_size('filevault')) as database_size;

-- Table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Storage efficiency (deduplication)
SELECT 
    COUNT(*) as total_files,
    COUNT(DISTINCT content_hash) as unique_files,
    ROUND(100.0 * COUNT(DISTINCT content_hash) / COUNT(*), 2) as dedup_ratio
FROM files;
```

### Usage Statistics
```sql
-- User storage usage
SELECT 
    u.email,
    u.name,
    pg_size_pretty(u.storage_used) as used,
    pg_size_pretty(u.storage_quota) as quota,
    ROUND(100.0 * u.storage_used / u.storage_quota, 2) as usage_percent
FROM users u
ORDER BY usage_percent DESC;

-- File type distribution  
SELECT 
    mime_type,
    COUNT(*) as file_count,
    pg_size_pretty(SUM(size)) as total_size
FROM files 
GROUP BY mime_type 
ORDER BY SUM(size) DESC;
```

- `id`: UUID (Primary Key)
- `file_id`: UUID (Foreign Key -> files.id)
- `user_id`: UUID (Foreign Key -> users.id)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### folder_shares

- `id`: UUID (Primary Key)
- `folder_id`: UUID (Foreign Key -> folders.id)
- `user_id`: UUID (Foreign Key -> users.id)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### tags

- `id`: UUID (Primary Key)
- `name`: VARCHAR(50) NOT NULL
- `created_at`: TIMESTAMP

### file_tags

- `file_id`: UUID (Foreign Key -> files.id)
- `tag_id`: UUID (Foreign Key -> tags.id)
- `created_at`: TIMESTAMP
- PRIMARY KEY (file_id, tag_id)

### audit_logs

- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key -> users.id)
- `action`: VARCHAR(50) NOT NULL
- `resource_type`: VARCHAR(50) NOT NULL
- `resource_id`: UUID NOT NULL
- `details`: JSONB
- `created_at`: TIMESTAMP

## Indexes

- `users_email_idx`: BTREE (users.email)
- `files_content_hash_idx`: BTREE (files.content_hash)
- `files_owner_id_idx`: BTREE (files.owner_id)
- `files_folder_id_idx`: BTREE (files.folder_id)
- `folders_owner_id_idx`: BTREE (folders.owner_id)
- `folders_parent_id_idx`: BTREE (folders.parent_id)
- `file_shares_user_id_idx`: BTREE (file_shares.user_id)
- `file_shares_file_id_idx`: BTREE (file_shares.file_id)
- `folder_shares_user_id_idx`: BTREE (folder_shares.user_id)
- `folder_shares_folder_id_idx`: BTREE (folder_shares.folder_id)
- `audit_logs_user_id_idx`: BTREE (audit_logs.user_id)
- `audit_logs_resource_id_idx`: BTREE (audit_logs.resource_id)
