package db

import (
	"fmt"
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Connect() {
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
	)

	config := &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	}

	db, err := gorm.Open(postgres.Open(dsn), config)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Auto Migrate the schema
	err = db.AutoMigrate(
		&User{},
		&File{},
		&Folder{},
		&FileContent{},
		&FileShare{},
		&FolderShare{},
		&Tag{},
		&AuditLog{},
		// RBAC models
		&Permission{},
		&Role{},
		&UserRole{},
		&ResourcePermission{},
	)
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	DB = db
	log.Println("Connected to database successfully")

	// Initialize RBAC system
	rbacService := NewRBACService(db)
	if err := rbacService.InitializeDefaultRoles(); err != nil {
		log.Printf("Warning: Failed to initialize RBAC system: %v", err)
	} else {
		log.Println("RBAC system initialized successfully")
	}
}
