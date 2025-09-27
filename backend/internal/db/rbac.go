package db

import (
	"time"

	"github.com/google/uuid"
)

// Permission represents a specific permission in the system
type Permission struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	Name        string    `gorm:"type:varchar(100);unique;not null"` // e.g., "file.read", "file.write", "admin.users"
	Description string    `gorm:"type:varchar(255)"`
	Category    string    `gorm:"type:varchar(50);not null"` // e.g., "file", "folder", "admin", "system"
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

// Role represents a role with multiple permissions
type Role struct {
	ID          uuid.UUID    `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	Name        string       `gorm:"type:varchar(50);unique;not null"` // e.g., "admin", "manager", "editor", "viewer"
	Description string       `gorm:"type:varchar(255)"`
	IsSystem    bool         `gorm:"default:false"` // System roles cannot be deleted
	CreatedAt   time.Time
	UpdatedAt   time.Time
	Permissions []Permission `gorm:"many2many:role_permissions;"`
}

// UserRole represents the many-to-many relationship between users and roles
type UserRole struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	UserID    uuid.UUID `gorm:"type:uuid;not null"`
	RoleID    uuid.UUID `gorm:"type:uuid;not null"`
	GrantedBy uuid.UUID `gorm:"type:uuid"` // Who granted this role
	CreatedAt time.Time
	UpdatedAt time.Time
	User      User `gorm:"foreignKey:UserID"`
	Role      Role `gorm:"foreignKey:RoleID"`
}

// ResourcePermission represents permissions on specific resources
type ResourcePermission struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	UserID       uuid.UUID `gorm:"type:uuid;not null"`
	ResourceType string    `gorm:"type:varchar(50);not null"` // "file", "folder"
	ResourceID   uuid.UUID `gorm:"type:uuid;not null"`
	Permission   string    `gorm:"type:varchar(50);not null"` // "read", "write", "delete", "share"
	GrantedBy    uuid.UUID `gorm:"type:uuid"`
	ExpiresAt    *time.Time
	CreatedAt    time.Time
	UpdatedAt    time.Time
	User         User `gorm:"foreignKey:UserID"`
}

// Predefined permission constants
const (
	// File permissions
	PermissionFileRead   = "file.read"
	PermissionFileWrite  = "file.write"
	PermissionFileDelete = "file.delete"
	PermissionFileShare  = "file.share"
	PermissionFileUpload = "file.upload"

	// Folder permissions
	PermissionFolderRead   = "folder.read"
	PermissionFolderWrite  = "folder.write"
	PermissionFolderDelete = "folder.delete"
	PermissionFolderShare  = "folder.share"
	PermissionFolderCreate = "folder.create"

	// Admin permissions
	PermissionAdminUsers     = "admin.users"
	PermissionAdminRoles     = "admin.roles"
	PermissionAdminAnalytics = "admin.analytics"
	PermissionAdminSystem    = "admin.system"

	// System permissions
	PermissionSystemSettings = "system.settings"
	PermissionSystemBackup   = "system.backup"
	PermissionSystemLogs     = "system.logs"
)

// Predefined roles
const (
	RoleAdmin       = "admin"
	RoleManager     = "manager"
	RoleEditor      = "editor"
	RoleViewer      = "viewer"
	RoleGuest       = "guest"
	RoleFileManager = "file_manager"
)

// Permission categories
const (
	CategoryFile   = "file"
	CategoryFolder = "folder"
	CategoryAdmin  = "admin"
	CategorySystem = "system"
)