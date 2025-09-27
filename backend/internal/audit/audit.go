package audit

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/BalkanID-University/vit-2026-capstone-internship-hiring-task-riyaautade/backend/internal/db"
)

// ActionType represents different types of audit actions
type ActionType string

const (
	// User actions
	ActionUserLogin    ActionType = "USER_LOGIN"
	ActionUserLogout   ActionType = "USER_LOGOUT"
	ActionUserRegister ActionType = "USER_REGISTER"
	ActionUserUpdate   ActionType = "USER_UPDATE"
	ActionUserDelete   ActionType = "USER_DELETE"

	// File actions
	ActionFileUpload   ActionType = "FILE_UPLOAD"
	ActionFileDownload ActionType = "FILE_DOWNLOAD"
	ActionFileDelete   ActionType = "FILE_DELETE"
	ActionFileUpdate   ActionType = "FILE_UPDATE"
	ActionFileShare    ActionType = "FILE_SHARE"
	ActionFileUnshare  ActionType = "FILE_UNSHARE"
	ActionFileMove     ActionType = "FILE_MOVE"
	ActionFileCopy     ActionType = "FILE_COPY"
	ActionFileView     ActionType = "FILE_VIEW"
	ActionFilePreview  ActionType = "FILE_PREVIEW"

	// Folder actions
	ActionFolderCreate ActionType = "FOLDER_CREATE"
	ActionFolderDelete ActionType = "FOLDER_DELETE"
	ActionFolderUpdate ActionType = "FOLDER_UPDATE"
	ActionFolderShare  ActionType = "FOLDER_SHARE"
	ActionFolderUnshare ActionType = "FOLDER_UNSHARE"
	ActionFolderMove   ActionType = "FOLDER_MOVE"
	ActionFolderView   ActionType = "FOLDER_VIEW"

	// Permission actions
	ActionPermissionGrant  ActionType = "PERMISSION_GRANT"
	ActionPermissionRevoke ActionType = "PERMISSION_REVOKE"
	ActionRoleChange       ActionType = "ROLE_CHANGE"

	// System actions
	ActionSystemStartup  ActionType = "SYSTEM_STARTUP"
	ActionSystemShutdown ActionType = "SYSTEM_SHUTDOWN"
	ActionSystemError    ActionType = "SYSTEM_ERROR"
	ActionSystemWarning  ActionType = "SYSTEM_WARNING"

	// Security actions
	ActionSecurityFailedLogin   ActionType = "SECURITY_FAILED_LOGIN"
	ActionSecurityPasswordReset ActionType = "SECURITY_PASSWORD_RESET"
	ActionSecuritySuspiciousActivity ActionType = "SECURITY_SUSPICIOUS_ACTIVITY"
)

// ResourceType represents different types of resources
type ResourceType string

const (
	ResourceTypeUser   ResourceType = "USER"
	ResourceTypeFile   ResourceType = "FILE"
	ResourceTypeFolder ResourceType = "FOLDER"
	ResourceTypeSystem ResourceType = "SYSTEM"
	ResourceTypeAuth   ResourceType = "AUTH"
)

// AuditDetails contains structured audit information
type AuditDetails struct {
	IPAddress     string                 `json:"ip_address,omitempty"`
	UserAgent     string                 `json:"user_agent,omitempty"`
	SessionID     string                 `json:"session_id,omitempty"`
	OldValues     map[string]interface{} `json:"old_values,omitempty"`
	NewValues     map[string]interface{} `json:"new_values,omitempty"`
	Metadata      map[string]interface{} `json:"metadata,omitempty"`
	ErrorMessage  string                 `json:"error_message,omitempty"`
	Duration      string                 `json:"duration,omitempty"`
	FileSize      int64                  `json:"file_size,omitempty"`
	FileMimeType  string                 `json:"file_mime_type,omitempty"`
	SharedWithID  *uuid.UUID             `json:"shared_with_id,omitempty"`
	ParentID      *uuid.UUID             `json:"parent_id,omitempty"`
	Success       bool                   `json:"success"`
	Timestamp     time.Time              `json:"timestamp"`
}

// Service provides audit logging functionality
type Service struct {
	db *gorm.DB
}

// NewService creates a new audit service
func NewService(database *gorm.DB) *Service {
	return &Service{
		db: database,
	}
}

// LogEvent logs an audit event
func (s *Service) LogEvent(ctx context.Context, userID *uuid.UUID, action ActionType, resourceType ResourceType, resourceID uuid.UUID, details *AuditDetails) error {
	// Set default timestamp if not provided
	if details != nil && details.Timestamp.IsZero() {
		details.Timestamp = time.Now()
	} else if details == nil {
		details = &AuditDetails{
			Timestamp: time.Now(),
		}
	}

	// Convert details to JSON
	detailsJSON := ""
	if details != nil {
		detailsBytes, err := json.Marshal(details)
		if err != nil {
			log.Printf("Failed to marshal audit details: %v", err)
		} else {
			detailsJSON = string(detailsBytes)
		}
	}

	// Create audit log entry
	auditLog := &db.AuditLog{
		UserID:       userID,
		Action:       string(action),
		ResourceType: string(resourceType),
		ResourceID:   resourceID,
		Details:      detailsJSON,
		CreatedAt:    time.Now(),
	}

	if err := s.db.Create(auditLog).Error; err != nil {
		log.Printf("Failed to create audit log: %v", err)
		return fmt.Errorf("failed to create audit log: %w", err)
	}

	return nil
}

// LogUserAction logs a user-related action
func (s *Service) LogUserAction(ctx context.Context, userID *uuid.UUID, action ActionType, targetUserID uuid.UUID, details *AuditDetails) error {
	return s.LogEvent(ctx, userID, action, ResourceTypeUser, targetUserID, details)
}

// LogFileAction logs a file-related action
func (s *Service) LogFileAction(ctx context.Context, userID *uuid.UUID, action ActionType, fileID uuid.UUID, details *AuditDetails) error {
	return s.LogEvent(ctx, userID, action, ResourceTypeFile, fileID, details)
}

// LogFolderAction logs a folder-related action
func (s *Service) LogFolderAction(ctx context.Context, userID *uuid.UUID, action ActionType, folderID uuid.UUID, details *AuditDetails) error {
	return s.LogEvent(ctx, userID, action, ResourceTypeFolder, folderID, details)
}

// LogSystemAction logs a system-related action
func (s *Service) LogSystemAction(ctx context.Context, action ActionType, details *AuditDetails) error {
	// Generate a random UUID for system events
	systemID := uuid.New()
	return s.LogEvent(ctx, nil, action, ResourceTypeSystem, systemID, details)
}

// LogAuthAction logs an authentication-related action
func (s *Service) LogAuthAction(ctx context.Context, userID *uuid.UUID, action ActionType, details *AuditDetails) error {
	// Generate a random UUID for auth events
	authID := uuid.New()
	return s.LogEvent(ctx, userID, action, ResourceTypeAuth, authID, details)
}

// GetLogs retrieves audit logs with filtering options
func (s *Service) GetLogs(ctx context.Context, options *GetLogsOptions) ([]*db.AuditLog, error) {
	query := s.db.Preload("User")

	if options != nil {
		if options.UserID != nil {
			query = query.Where("user_id = ?", *options.UserID)
		}
		if options.ResourceType != "" {
			query = query.Where("resource_type = ?", options.ResourceType)
		}
		if options.ResourceID != nil {
			query = query.Where("resource_id = ?", *options.ResourceID)
		}
		if options.Action != "" {
			query = query.Where("action = ?", options.Action)
		}
		if !options.StartDate.IsZero() {
			query = query.Where("created_at >= ?", options.StartDate)
		}
		if !options.EndDate.IsZero() {
			query = query.Where("created_at <= ?", options.EndDate)
		}
		if options.Limit > 0 {
			query = query.Limit(options.Limit)
		}
		if options.Offset > 0 {
			query = query.Offset(options.Offset)
		}
	}

	// Default ordering by most recent first
	query = query.Order("created_at DESC")

	var logs []*db.AuditLog
	if err := query.Find(&logs).Error; err != nil {
		return nil, fmt.Errorf("failed to get audit logs: %w", err)
	}

	return logs, nil
}

// GetLogsByResource gets all audit logs for a specific resource
func (s *Service) GetLogsByResource(ctx context.Context, resourceType ResourceType, resourceID uuid.UUID, limit int) ([]*db.AuditLog, error) {
	options := &GetLogsOptions{
		ResourceType: string(resourceType),
		ResourceID:   &resourceID,
		Limit:        limit,
	}
	return s.GetLogs(ctx, options)
}

// GetLogsByUser gets all audit logs for a specific user
func (s *Service) GetLogsByUser(ctx context.Context, userID uuid.UUID, limit int) ([]*db.AuditLog, error) {
	options := &GetLogsOptions{
		UserID: &userID,
		Limit:  limit,
	}
	return s.GetLogs(ctx, options)
}

// GetLogsOptions defines filtering options for audit logs
type GetLogsOptions struct {
	UserID       *uuid.UUID
	ResourceType string
	ResourceID   *uuid.UUID
	Action       string
	StartDate    time.Time
	EndDate      time.Time
	Limit        int
	Offset       int
}

// Helper functions for common audit scenarios

// LogLoginAttempt logs a login attempt with IP and user agent
func (s *Service) LogLoginAttempt(ctx context.Context, userID *uuid.UUID, success bool, ipAddress, userAgent string) error {
	action := ActionUserLogin
	if !success {
		action = ActionSecurityFailedLogin
	}

	details := &AuditDetails{
		IPAddress: ipAddress,
		UserAgent: userAgent,
		Success:   success,
	}

	if userID != nil {
		return s.LogUserAction(ctx, userID, action, *userID, details)
	} else {
		return s.LogAuthAction(ctx, nil, action, details)
	}
}

// LogFileOperation logs file upload/download with metadata
func (s *Service) LogFileOperation(ctx context.Context, userID *uuid.UUID, action ActionType, fileID uuid.UUID, fileName string, fileSize int64, mimeType string) error {
	details := &AuditDetails{
		FileSize:     fileSize,
		FileMimeType: mimeType,
		Metadata: map[string]interface{}{
			"file_name": fileName,
		},
		Success: true,
	}

	return s.LogFileAction(ctx, userID, action, fileID, details)
}

// LogPermissionChange logs permission/role changes with before/after values
func (s *Service) LogPermissionChange(ctx context.Context, userID *uuid.UUID, action ActionType, targetUserID uuid.UUID, oldRole, newRole string) error {
	details := &AuditDetails{
		OldValues: map[string]interface{}{
			"role": oldRole,
		},
		NewValues: map[string]interface{}{
			"role": newRole,
		},
		Success: true,
	}

	return s.LogUserAction(ctx, userID, action, targetUserID, details)
}