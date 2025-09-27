package graph

import (
	"github.com/BalkanID-University/vit-2026-capstone-internship-hiring-task-riyaautade/backend/internal/audit"
	"github.com/BalkanID-University/vit-2026-capstone-internship-hiring-task-riyaautade/backend/internal/storage"
	"gorm.io/gorm"
)

// This file will not be regenerated automatically.
//
// It serves as dependency injection for your app, add any dependencies you require here.

type Resolver struct {
	DB      *gorm.DB
	Storage *storage.StorageManager
	Audit   *audit.Service
}
