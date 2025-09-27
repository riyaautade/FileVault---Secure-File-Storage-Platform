// Package db defines the database models and structures for the FileVault system.
// This package contains all GORM model definitions, database relationships,
// and data structures used throughout the application.
package db

import (
	"time"

	"github.com/google/uuid"
)

// User represents a user account in the FileVault system.
// Users can have different roles (admin, user, guest) and have storage quotas.
// The model supports file ownership, sharing, and activity tracking.
type User struct {
	// ID is the unique identifier for the user, automatically generated as UUID
	ID uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	
	// Email is the user's email address, used for authentication and must be unique
	Email string `gorm:"type:varchar(255);unique;not null"`
	
	// PasswordHash stores the bcrypt-hashed password for secure authentication
	PasswordHash string `gorm:"type:varchar(255);not null"`
	
	// Name is the user's display name shown in the interface
	Name string `gorm:"type:varchar(255);not null"`
	
	// Role defines the user's permission level: 'admin', 'user', or 'guest'
	Role string `gorm:"type:varchar(20);not null;default:'user'"`
	
	// StorageUsed tracks the total bytes of storage currently used by the user
	StorageUsed int64 `gorm:"default:0"`
	
	// StorageQuota defines the maximum storage allowed for the user (default: 10MB)
	StorageQuota int64 `gorm:"default:10485760"` // 10MB default
	
	// CreatedAt timestamp when the user account was created
	CreatedAt time.Time
	
	// UpdatedAt timestamp when the user account was last modified
	UpdatedAt time.Time
	
	// Files represents all files owned by this user
	Files []File `gorm:"foreignKey:OwnerID"`
	
	// Folders represents all folders owned by this user
	Folders []Folder `gorm:"foreignKey:OwnerID"`
	
	// FileShares represents files shared with this user
	FileShares []FileShare
	
	// FolderShares represents folders shared with this user
	FolderShares []FolderShare
}

// File represents a file stored in the FileVault system.
// Files support deduplication through content hashing, hierarchical organization
// through folders, and can be shared between users or made public.
type File struct {
	// ID is the unique identifier for the file
	ID uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	
	// Name is the display name of the file (can be renamed by user)
	Name string `gorm:"type:varchar(255);not null"`
	
	// ContentHash is the SHA256 hash of the file content, used for deduplication
	ContentHash string `gorm:"type:varchar(64);not null"`
	
	// MimeType stores the MIME type of the file (e.g., image/jpeg, application/pdf)
	MimeType string `gorm:"type:varchar(127);not null"`
	
	// Size is the file size in bytes
	Size int64 `gorm:"not null"`
	
	// OwnerID references the user who owns this file
	OwnerID uuid.UUID `gorm:"type:uuid;not null"`
	
	// FolderID references the parent folder (null for root-level files)
	FolderID *uuid.UUID `gorm:"type:uuid"`
	
	// IsPublic indicates whether the file can be accessed without authentication
	IsPublic bool `gorm:"default:false"`
	
	// DownloadCount tracks how many times the file has been downloaded
	DownloadCount int `gorm:"default:0"`
	
	// CreatedAt timestamp when the file was uploaded
	CreatedAt time.Time
	
	// UpdatedAt timestamp when the file metadata was last modified
	UpdatedAt time.Time
	
	// Owner is the user who owns this file
	Owner User `gorm:"foreignKey:OwnerID"`
	
	// Folder is the parent folder containing this file (optional)
	Folder *Folder `gorm:"foreignKey:FolderID"`
	
	// Tags associated with this file for categorization and search
	Tags []Tag `gorm:"many2many:file_tags;"`
	
	// SharedWith represents users who have access to this file through sharing
	SharedWith []FileShare
}

// Folder represents a hierarchical container for organizing files.
// Folders support nested structures and can be shared between users or made public.
type Folder struct {
	// ID is the unique identifier for the folder
	ID uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	
	// Name is the display name of the folder
	Name string `gorm:"type:varchar(255);not null"`
	
	// OwnerID references the user who owns this folder
	OwnerID uuid.UUID `gorm:"type:uuid;not null"`
	
	// ParentID references the parent folder (null for root-level folders)
	ParentID *uuid.UUID `gorm:"type:uuid"`
	
	// IsPublic indicates whether the folder can be accessed without authentication
	IsPublic bool `gorm:"default:false"`
	
	// CreatedAt timestamp when the folder was created
	CreatedAt time.Time
	
	// UpdatedAt timestamp when the folder was last modified
	UpdatedAt time.Time
	
	// Owner is the user who owns this folder
	Owner User `gorm:"foreignKey:OwnerID"`
	
	// Parent is the parent folder (optional for nested structure)
	Parent *Folder `gorm:"foreignKey:ParentID"`
	
	// Files contained within this folder
	Files []File `gorm:"foreignKey:FolderID"`
	
	// Subfolders are child folders within this folder
	Subfolders []Folder `gorm:"foreignKey:ParentID"`
	
	// SharedWith represents users who have access to this folder through sharing
	SharedWith []FolderShare
}

// FileContent manages the physical storage of file data with deduplication.
// Multiple files can reference the same FileContent if they have identical content.
type FileContent struct {
	// ContentHash is the SHA256 hash serving as the primary key
	ContentHash string `gorm:"type:varchar(64);primary_key"`
	
	// Path is the file system path where the actual file data is stored
	Path string `gorm:"type:varchar(511);not null"`
	
	// ReferenceCount tracks how many files reference this content for cleanup
	ReferenceCount int `gorm:"default:1"`
	
	// CreatedAt timestamp when this content was first stored
	CreatedAt time.Time
}

// FileShare represents a sharing relationship between a file and a user.
// This allows files to be accessible to users other than the owner.
type FileShare struct {
	// ID is the unique identifier for this sharing relationship
	ID uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	
	// FileID references the shared file
	FileID uuid.UUID `gorm:"type:uuid;not null"`
	
	// UserID references the user receiving access
	UserID uuid.UUID `gorm:"type:uuid;not null"`
	
	// CreatedAt timestamp when the sharing was created
	CreatedAt time.Time
	
	// UpdatedAt timestamp when the sharing was last modified
	UpdatedAt time.Time
	
	// File is the shared file object
	File File `gorm:"foreignKey:FileID"`
	
	// User is the user who received access to the file
	User User `gorm:"foreignKey:UserID"`
}

// FolderShare represents a sharing relationship between a folder and a user.
// This allows folders (and their contents) to be accessible to users other than the owner.
type FolderShare struct {
	// ID is the unique identifier for this sharing relationship
	ID uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	
	// FolderID references the shared folder
	FolderID uuid.UUID `gorm:"type:uuid;not null"`
	
	// UserID references the user receiving access
	UserID uuid.UUID `gorm:"type:uuid;not null"`
	
	// CreatedAt timestamp when the sharing was created
	CreatedAt time.Time
	
	// UpdatedAt timestamp when the sharing was last modified
	UpdatedAt time.Time
	
	// Folder is the shared folder object
	Folder Folder `gorm:"foreignKey:FolderID"`
	
	// User is the user who received access to the folder
	User User `gorm:"foreignKey:UserID"`
}

// Tag represents a label that can be applied to files for categorization and search.
// Tags have unique names and support many-to-many relationships with files.
type Tag struct {
	// ID is the unique identifier for the tag
	ID uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	
	// Name is the unique tag name (case-sensitive)
	Name string `gorm:"type:varchar(50);unique;not null"`
	
	// CreatedAt timestamp when the tag was created
	CreatedAt time.Time
	
	// Files represents all files that have this tag applied
	Files []File `gorm:"many2many:file_tags;"`
}

// AuditLog records all significant actions performed in the system for security,
// compliance, and debugging purposes. Logs are immutable once created.
type AuditLog struct {
	// ID is the unique identifier for this audit log entry
	ID uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	
	// UserID references the user who performed the action (null for system actions)
	UserID *uuid.UUID `gorm:"type:uuid"`
	
	// Action describes what operation was performed (CREATE, UPDATE, DELETE, etc.)
	Action string `gorm:"type:varchar(50);not null"`
	
	// ResourceType identifies the type of resource affected (FILE, FOLDER, USER, etc.)
	ResourceType string `gorm:"type:varchar(50);not null"`
	
	// ResourceID identifies the specific resource that was affected
	ResourceID uuid.UUID `gorm:"type:uuid;not null"`
	
	// Details contains additional information about the action in JSON format
	Details string `gorm:"type:jsonb"`
	
	// CreatedAt timestamp when the action occurred (immutable)
	CreatedAt time.Time
	
	// User is the user who performed the action (optional for system actions)
	User *User `gorm:"foreignKey:UserID"`
}
