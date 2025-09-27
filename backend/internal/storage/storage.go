// Package storage provides file storage management with deduplication capabilities.
// This package handles physical file storage, content hashing for deduplication,
// MIME type validation, and file system operations for the FileVault system.
package storage

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
)

// StorageManager handles file storage operations with deduplication support.
// Files are stored using their SHA256 hash as the filename to enable
// automatic deduplication of identical content.
type StorageManager struct {
	// basePath is the root directory where files are stored
	basePath string
}

// NewStorageManager creates a new storage manager instance.
// It ensures the storage directory exists and is writable.
//
// Parameters:
//   - basePath: The root directory path for file storage
//
// Returns:
//   - *StorageManager: The configured storage manager
//   - error: Any error that occurred during initialization
func NewStorageManager(basePath string) (*StorageManager, error) {
	if err := os.MkdirAll(basePath, 0755); err != nil {
		return nil, fmt.Errorf("failed to create storage directory: %w", err)
	}
	return &StorageManager{basePath: basePath}, nil
}

// CalculateHash generates a SHA256 hash of the file content.
// This hash is used for deduplication - files with identical content
// will have the same hash and can share storage space.
//
// The function resets the file pointer to the beginning after reading
// to allow subsequent operations on the same file.
//
// Parameters:
//   - file: An io.ReadSeeker containing the file data
//
// Returns:
//   - string: The hexadecimal SHA256 hash of the file content
//   - error: Any error that occurred during hashing or seeking
func (sm *StorageManager) CalculateHash(file io.ReadSeeker) (string, error) {
	hash := sha256.New()
	if _, err := io.Copy(hash, file); err != nil {
		return "", fmt.Errorf("failed to calculate hash: %w", err)
	}

	// Reset file pointer to beginning for subsequent operations
	if _, err := file.Seek(0, 0); err != nil {
		return "", fmt.Errorf("failed to reset file pointer: %w", err)
	}

	return hex.EncodeToString(hash.Sum(nil)), nil
}

// SaveFile stores a file in the filesystem
func (sm *StorageManager) SaveFile(file io.ReadSeeker, contentHash string) error {
	filePath := filepath.Join(sm.basePath, contentHash)

	// Check if file already exists (deduplication)
	if _, err := os.Stat(filePath); err == nil {
		return nil // File already exists
	}

	// Create new file
	dst, err := os.Create(filePath)
	if err != nil {
		return fmt.Errorf("failed to create file: %w", err)
	}
	defer dst.Close()

	// Copy file content
	if _, err := io.Copy(dst, file); err != nil {
		return fmt.Errorf("failed to save file: %w", err)
	}

	return nil
}

// DeleteFile removes a file from the filesystem
func (sm *StorageManager) DeleteFile(contentHash string) error {
	filePath := filepath.Join(sm.basePath, contentHash)
	if err := os.Remove(filePath); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("failed to delete file: %w", err)
	}
	return nil
}

// GetFilePath returns the absolute path to a stored file
func (sm *StorageManager) GetFilePath(contentHash string) string {
	return filepath.Join(sm.basePath, contentHash)
}

// GetFile reads and returns the content of a stored file
func (sm *StorageManager) GetFile(contentHash string) ([]byte, error) {
	filePath := filepath.Join(sm.basePath, contentHash)

	// Check if file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return nil, fmt.Errorf("file not found")
	}

	// Read file content
	content, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to read file: %w", err)
	}

	return content, nil
}

// ValidateMimeType checks if the file's actual MIME type matches the declared one
func (sm *StorageManager) ValidateMimeType(file io.ReadSeeker, declaredType string) (bool, error) {
	// Read first 512 bytes to determine MIME type
	buffer := make([]byte, 512)
	_, err := file.Read(buffer)
	if err != nil && err != io.EOF {
		return false, fmt.Errorf("failed to read file header: %w", err)
	}

	// Reset file pointer
	if _, err := file.Seek(0, 0); err != nil {
		return false, fmt.Errorf("failed to reset file pointer: %w", err)
	}

	// Get actual MIME type
	actualType := http.DetectContentType(buffer)

	// Compare with declared type
	// Note: This is a simple comparison, in production you might want to use a MIME type mapping
	return actualType == declaredType, nil
}
