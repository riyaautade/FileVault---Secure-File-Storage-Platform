package db

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// RBACService handles role-based access control operations
type RBACService struct {
	db *gorm.DB
}

// NewRBACService creates a new RBAC service
func NewRBACService(db *gorm.DB) *RBACService {
	return &RBACService{db: db}
}

// HasPermission checks if a user has a specific permission
func (r *RBACService) HasPermission(userID uuid.UUID, permission string) (bool, error) {
	// Check if user has direct permission through roles
	var count int64
	err := r.db.Table("user_roles").
		Joins("JOIN roles ON user_roles.role_id = roles.id").
		Joins("JOIN role_permissions ON roles.id = role_permissions.role_id").
		Joins("JOIN permissions ON role_permissions.permission_id = permissions.id").
		Where("user_roles.user_id = ? AND permissions.name = ?", userID, permission).
		Count(&count).Error

	if err != nil {
		return false, err
	}

	return count > 0, nil
}

// HasResourcePermission checks if a user has permission on a specific resource
func (r *RBACService) HasResourcePermission(userID uuid.UUID, resourceType string, resourceID uuid.UUID, permission string) (bool, error) {
	var count int64
	err := r.db.Model(&ResourcePermission{}).
		Where("user_id = ? AND resource_type = ? AND resource_id = ? AND permission = ? AND (expires_at IS NULL OR expires_at > ?)",
			userID, resourceType, resourceID, permission, time.Now()).
		Count(&count).Error

	if err != nil {
		return false, err
	}

	return count > 0, nil
}

// GetUserRoles returns all roles assigned to a user
func (r *RBACService) GetUserRoles(userID uuid.UUID) ([]Role, error) {
	var roles []Role
	err := r.db.Table("roles").
		Joins("JOIN user_roles ON roles.id = user_roles.role_id").
		Where("user_roles.user_id = ?", userID).
		Find(&roles).Error
	
	return roles, err
}

// GetUserPermissions returns all permissions for a user (through roles)
func (r *RBACService) GetUserPermissions(userID uuid.UUID) ([]Permission, error) {
	var permissions []Permission
	err := r.db.Table("permissions").
		Joins("JOIN role_permissions ON permissions.id = role_permissions.permission_id").
		Joins("JOIN roles ON role_permissions.role_id = roles.id").
		Joins("JOIN user_roles ON roles.id = user_roles.role_id").
		Where("user_roles.user_id = ?", userID).
		Distinct().
		Find(&permissions).Error
	
	return permissions, err
}

// AssignRoleToUser assigns a role to a user
func (r *RBACService) AssignRoleToUser(userID, roleID, grantedBy uuid.UUID) error {
	// Check if role assignment already exists
	var existing UserRole
	err := r.db.Where("user_id = ? AND role_id = ?", userID, roleID).First(&existing).Error
	if err == nil {
		return fmt.Errorf("user already has this role")
	}

	userRole := UserRole{
		UserID:    userID,
		RoleID:    roleID,
		GrantedBy: grantedBy,
	}

	return r.db.Create(&userRole).Error
}

// RemoveRoleFromUser removes a role from a user
func (r *RBACService) RemoveRoleFromUser(userID, roleID uuid.UUID) error {
	return r.db.Where("user_id = ? AND role_id = ?", userID, roleID).Delete(&UserRole{}).Error
}

// GrantResourcePermission grants a specific permission on a resource to a user
func (r *RBACService) GrantResourcePermission(userID uuid.UUID, resourceType string, resourceID uuid.UUID, permission string, grantedBy uuid.UUID, expiresAt *time.Time) error {
	resourcePerm := ResourcePermission{
		UserID:       userID,
		ResourceType: resourceType,
		ResourceID:   resourceID,
		Permission:   permission,
		GrantedBy:    grantedBy,
		ExpiresAt:    expiresAt,
	}

	return r.db.Create(&resourcePerm).Error
}

// RevokeResourcePermission revokes a specific permission on a resource from a user
func (r *RBACService) RevokeResourcePermission(userID uuid.UUID, resourceType string, resourceID uuid.UUID, permission string) error {
	return r.db.Where("user_id = ? AND resource_type = ? AND resource_id = ? AND permission = ?",
		userID, resourceType, resourceID, permission).Delete(&ResourcePermission{}).Error
}

// IsAdmin checks if a user is an admin
func (r *RBACService) IsAdmin(userID uuid.UUID) (bool, error) {
	return r.HasPermission(userID, PermissionAdminSystem)
}

// CanReadFile checks if a user can read a specific file
func (r *RBACService) CanReadFile(userID, fileID uuid.UUID) (bool, error) {
	// Check if user owns the file
	var file File
	err := r.db.Where("id = ? AND owner_id = ?", fileID, userID).First(&file).Error
	if err == nil {
		return true, nil // Owner can always read their files
	}

	// Check if file is public
	err = r.db.Where("id = ? AND is_public = ?", fileID, true).First(&file).Error
	if err == nil {
		return true, nil // Anyone can read public files
	}

	// Check global permission
	hasGlobalRead, err := r.HasPermission(userID, PermissionFileRead)
	if err != nil {
		return false, err
	}
	if hasGlobalRead {
		return true, nil
	}

	// Check resource-specific permission
	return r.HasResourcePermission(userID, "file", fileID, "read")
}

// CanWriteFile checks if a user can modify a specific file
func (r *RBACService) CanWriteFile(userID, fileID uuid.UUID) (bool, error) {
	// Check if user owns the file
	var file File
	err := r.db.Where("id = ? AND owner_id = ?", fileID, userID).First(&file).Error
	if err == nil {
		return true, nil // Owner can always write their files
	}

	// Check global permission
	hasGlobalWrite, err := r.HasPermission(userID, PermissionFileWrite)
	if err != nil {
		return false, err
	}
	if hasGlobalWrite {
		return true, nil
	}

	// Check resource-specific permission
	return r.HasResourcePermission(userID, "file", fileID, "write")
}

// CanDeleteFile checks if a user can delete a specific file
func (r *RBACService) CanDeleteFile(userID, fileID uuid.UUID) (bool, error) {
	// Check if user owns the file
	var file File
	err := r.db.Where("id = ? AND owner_id = ?", fileID, userID).First(&file).Error
	if err == nil {
		return true, nil // Owner can always delete their files
	}

	// Check global permission
	hasGlobalDelete, err := r.HasPermission(userID, PermissionFileDelete)
	if err != nil {
		return false, err
	}
	if hasGlobalDelete {
		return true, nil
	}

	// Check resource-specific permission
	return r.HasResourcePermission(userID, "file", fileID, "delete")
}

// InitializeDefaultRoles creates default roles and permissions
func (r *RBACService) InitializeDefaultRoles() error {
	// Define default permissions
	permissions := []Permission{
		{Name: PermissionFileRead, Description: "Read files", Category: CategoryFile},
		{Name: PermissionFileWrite, Description: "Write/modify files", Category: CategoryFile},
		{Name: PermissionFileDelete, Description: "Delete files", Category: CategoryFile},
		{Name: PermissionFileShare, Description: "Share files", Category: CategoryFile},
		{Name: PermissionFileUpload, Description: "Upload files", Category: CategoryFile},
		{Name: PermissionFolderRead, Description: "Read folders", Category: CategoryFolder},
		{Name: PermissionFolderWrite, Description: "Write/modify folders", Category: CategoryFolder},
		{Name: PermissionFolderDelete, Description: "Delete folders", Category: CategoryFolder},
		{Name: PermissionFolderShare, Description: "Share folders", Category: CategoryFolder},
		{Name: PermissionFolderCreate, Description: "Create folders", Category: CategoryFolder},
		{Name: PermissionAdminUsers, Description: "Manage users", Category: CategoryAdmin},
		{Name: PermissionAdminRoles, Description: "Manage roles", Category: CategoryAdmin},
		{Name: PermissionAdminAnalytics, Description: "View analytics", Category: CategoryAdmin},
		{Name: PermissionAdminSystem, Description: "System administration", Category: CategoryAdmin},
		{Name: PermissionSystemSettings, Description: "System settings", Category: CategorySystem},
		{Name: PermissionSystemBackup, Description: "System backup", Category: CategorySystem},
		{Name: PermissionSystemLogs, Description: "System logs", Category: CategorySystem},
	}

	// Create permissions
	for _, perm := range permissions {
		var existing Permission
		err := r.db.Where("name = ?", perm.Name).First(&existing).Error
		if err != nil {
			if err := r.db.Create(&perm).Error; err != nil {
				return fmt.Errorf("failed to create permission %s: %w", perm.Name, err)
			}
		}
	}

	// Define default roles with their permissions
	rolePermissions := map[string][]string{
		RoleAdmin: {
			PermissionFileRead, PermissionFileWrite, PermissionFileDelete, PermissionFileShare, PermissionFileUpload,
			PermissionFolderRead, PermissionFolderWrite, PermissionFolderDelete, PermissionFolderShare, PermissionFolderCreate,
			PermissionAdminUsers, PermissionAdminRoles, PermissionAdminAnalytics, PermissionAdminSystem,
			PermissionSystemSettings, PermissionSystemBackup, PermissionSystemLogs,
		},
		RoleManager: {
			PermissionFileRead, PermissionFileWrite, PermissionFileDelete, PermissionFileShare, PermissionFileUpload,
			PermissionFolderRead, PermissionFolderWrite, PermissionFolderDelete, PermissionFolderShare, PermissionFolderCreate,
			PermissionAdminAnalytics,
		},
		RoleEditor: {
			PermissionFileRead, PermissionFileWrite, PermissionFileShare, PermissionFileUpload,
			PermissionFolderRead, PermissionFolderWrite, PermissionFolderShare, PermissionFolderCreate,
		},
		RoleViewer: {
			PermissionFileRead,
			PermissionFolderRead,
		},
		RoleFileManager: {
			PermissionFileRead, PermissionFileWrite, PermissionFileDelete, PermissionFileShare, PermissionFileUpload,
			PermissionFolderRead, PermissionFolderCreate,
		},
	}

	// Create roles
	for roleName, permNames := range rolePermissions {
		var role Role
		err := r.db.Where("name = ?", roleName).First(&role).Error
		if err != nil {
			role = Role{
				Name:        roleName,
				Description: fmt.Sprintf("Default %s role", roleName),
				IsSystem:    true,
			}
			if err := r.db.Create(&role).Error; err != nil {
				return fmt.Errorf("failed to create role %s: %w", roleName, err)
			}
		}

		// Assign permissions to role
		for _, permName := range permNames {
			var perm Permission
			if err := r.db.Where("name = ?", permName).First(&perm).Error; err != nil {
				continue
			}

			// Check if association exists
			var count int64
			r.db.Table("role_permissions").
				Where("role_id = ? AND permission_id = ?", role.ID, perm.ID).
				Count(&count)

			if count == 0 {
				if err := r.db.Model(&role).Association("Permissions").Append(&perm); err != nil {
					return fmt.Errorf("failed to assign permission %s to role %s: %w", permName, roleName, err)
				}
			}
		}
	}

	return nil
}