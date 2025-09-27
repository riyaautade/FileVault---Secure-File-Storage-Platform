package graph

import (
	"net/http"
	"strconv"

	"github.com/BalkanID-University/vit-2026-capstone-internship-hiring-task-riyaautade/backend/internal/audit"
	"github.com/BalkanID-University/vit-2026-capstone-internship-hiring-task-riyaautade/backend/internal/db"
	"github.com/BalkanID-University/vit-2026-capstone-internship-hiring-task-riyaautade/backend/internal/storage"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// HandleFileDownload handles file download requests
func HandleFileDownload(w http.ResponseWriter, r *http.Request, database *gorm.DB, storageManager *storage.StorageManager, auditService *audit.Service) {
	fileID := chi.URLParam(r, "fileId")
	if fileID == "" {
		http.Error(w, "File ID is required", http.StatusBadRequest)
		return
	}

	// Get file from database
	var file db.File
	if err := database.First(&file, "id = ?", fileID).Error; err != nil {
		http.Error(w, "File not found", http.StatusNotFound)
		return
	}

	// Get file content
	fileData, err := storageManager.GetFile(file.ContentHash)
	if err != nil {
		http.Error(w, "Failed to retrieve file", http.StatusInternalServerError)
		return
	}

	// Get user info from context (if authenticated)
	user, _ := GetUserFromContext(r.Context())
	var userPtr *uuid.UUID
	if user != nil {
		userPtr = &user.ID
	}

	// Update download count
	file.DownloadCount++
	database.Save(&file)

	// Log audit event
	auditService.LogFileOperation(r.Context(), userPtr, audit.ActionFileDownload, file.ID, file.Name, file.Size, file.MimeType)

	// Set response headers
	w.Header().Set("Content-Disposition", "attachment; filename=\""+file.Name+"\"")
	w.Header().Set("Content-Type", file.MimeType)
	w.Header().Set("Content-Length", strconv.Itoa(int(file.Size)))

	// Write file content
	w.Write(fileData)
}
