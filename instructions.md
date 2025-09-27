
## Table of Contents
1. [Getting Started](#getting-started)
2. [Development Environment](#development-environment)
3. [Code Style Guidelines](#code-style-guidelines)
4. [Contribution Process](#contribution-process)
5. [Testing Requirements](#testing-requirements)
6. [Documentation Standards](#documentation-standards)
7. [Security Guidelines](#security-guidelines)
8. [Review Process](#review-process)

## Getting Started

### Prerequisites
Before contributing, ensure you have:
- Go 1.21+ installed
- Node.js 16+ installed
- PostgreSQL 12+ installed
- Docker and Docker Compose
- Git configured with your GitHub account

### First Steps
1. **Fork** the repository on GitHub
2. **Clone** your fork locally
3. **Set up** the development environment (see [SETUP.md](./docs/SETUP.md))
4. **Create** a feature branch from `main`
5. **Make** your changes
6. **Test** thoroughly
7. **Submit** a pull request

## Development Environment

### Backend Development
```bash
# Set up Go environment
cd backend
go mod download
go mod tidy

# Install development tools
go install github.com/cosmtrek/air@latest  # Hot reload
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest  # Linting

# Run with hot reload
air
```

### Frontend Development
```bash
# Set up Node.js environment
cd frontend
npm install

# Install development tools
npm install -g @typescript-eslint/parser @typescript-eslint/eslint-plugin

# Run development server
npm start
```

### Database Development
```bash
# Install migration tool
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest

# Create new migration
migrate create -ext sql -dir backend/migrations -seq add_new_feature

# Run migrations
migrate -path backend/migrations -database "postgres://user:pass@localhost/filevault?sslmode=disable" up
```

## Code Style Guidelines

### Go Code Style

#### General Principles
- Follow [Go Code Review Comments](https://github.com/golang/go/wiki/CodeReviewComments)
- Use `gofmt` for consistent formatting
- Write idiomatic Go code with proper error handling
- Use descriptive variable and function names

#### Documentation Requirements
```go
// Package example demonstrates proper Go documentation.
// This package provides utilities for file management and processing.
package example

// FileManager handles file operations with deduplication support.
// It provides methods for storing, retrieving, and managing files
// in the FileVault system.
type FileManager struct {
    // basePath is the root directory for file storage
    basePath string
    // logger provides structured logging for operations
    logger   *log.Logger
}

// NewFileManager creates a new FileManager instance.
// It initializes the storage directory and validates configuration.
//
// Parameters:
//   - basePath: The root directory path for file storage
//   - logger: Logger instance for operation tracking
//
// Returns:
//   - *FileManager: Configured file manager instance
//   - error: Any initialization error that occurred
func NewFileManager(basePath string, logger *log.Logger) (*FileManager, error) {
    if basePath == "" {
        return nil, fmt.Errorf("basePath cannot be empty")
    }
    
    if err := os.MkdirAll(basePath, 0755); err != nil {
        return nil, fmt.Errorf("failed to create storage directory: %w", err)
    }
    
    return &FileManager{
        basePath: basePath,
        logger:   logger,
    }, nil
}
```

#### Error Handling
```go
// Good: Wrap errors with context
func (fm *FileManager) SaveFile(content []byte, filename string) error {
    if len(content) == 0 {
        return fmt.Errorf("file content cannot be empty")
    }
    
    path := filepath.Join(fm.basePath, filename)
    if err := os.WriteFile(path, content, 0644); err != nil {
        return fmt.Errorf("failed to save file %s: %w", filename, err)
    }
    
    return nil
}

// Bad: Swallow errors or return unclear error messages
func (fm *FileManager) SaveFile(content []byte, filename string) error {
    path := filepath.Join(fm.basePath, filename)
    os.WriteFile(path, content, 0644) // Missing error handling
    return nil
}
```

#### Testing
```go
func TestFileManager_SaveFile(t *testing.T) {
    tests := []struct {
        name        string
        content     []byte
        filename    string
        wantErr     bool
        errContains string
    }{
        {
            name:     "valid file save",
            content:  []byte("test content"),
            filename: "test.txt",
            wantErr:  false,
        },
        {
            name:        "empty content",
            content:     []byte{},
            filename:    "test.txt",
            wantErr:     true,
            errContains: "content cannot be empty",
        },
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            fm, err := NewFileManager(t.TempDir(), log.Default())
            require.NoError(t, err)
            
            err = fm.SaveFile(tt.content, tt.filename)
            
            if tt.wantErr {
                assert.Error(t, err)
                if tt.errContains != "" {
                    assert.Contains(t, err.Error(), tt.errContains)
                }
            } else {
                assert.NoError(t, err)
            }
        })
    }
}
```

### TypeScript/React Code Style

#### Component Documentation
```typescript
/**
 * @fileoverview FileUpload component for handling file uploads with progress tracking
 * @description This component provides drag-and-drop file upload functionality
 * with real-time progress updates and validation.
 */

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

/**
 * Props interface for the FileUpload component
 */
interface FileUploadProps {
  /** Callback function when files are successfully uploaded */
  onUpload?: (files: File[]) => void;
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Accepted file types (MIME types) */
  acceptedTypes?: string[];
  /** Whether to allow multiple file selection */
  multiple?: boolean;
  /** Whether the upload is currently disabled */
  disabled?: boolean;
}

/**
 * FileUpload Component
 * 
 * Provides a drag-and-drop interface for file uploads with the following features:
 * - Visual feedback for drag states
 * - File type and size validation
 * - Progress tracking for uploads
 * - Error handling and user feedback
 * 
 * @param props - The component props
 * @returns JSX element representing the file upload interface
 */
export const FileUpload: React.FC<FileUploadProps> = ({
  onUpload,
  maxSize = 10 * 1024 * 1024, // 10MB default
  acceptedTypes = [],
  multiple = true,
  disabled = false,
}) => {
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  
  /**
   * Handles file drop events and validates files before upload
   * @param acceptedFiles - Array of valid files from the dropzone
   */
  const handleDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0 || disabled) {
      return;
    }
    
    // Validate file sizes
    const oversizedFiles = acceptedFiles.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      console.error('Files too large:', oversizedFiles.map(f => f.name));
      return;
    }
    
    // Start upload process
    setIsUploading(true);
    setUploadProgress(0);
    
    onUpload?.(acceptedFiles);
  }, [onUpload, maxSize, disabled]);
  
  // Component implementation...
};
```

#### Hooks and Utilities
```typescript
/**
 * Custom hook for managing file upload state and operations
 * 
 * @param options - Configuration options for the file upload
 * @returns Object containing upload state and functions
 */
export const useFileUpload = (options: UseFileUploadOptions) => {
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Uploads files with progress tracking
   * @param filesToUpload - Array of files to upload
   */
  const uploadFiles = useCallback(async (filesToUpload: File[]) => {
    setError(null);
    setProgress(0);
    
    try {
      // Upload implementation with progress tracking
      for (let i = 0; i < filesToUpload.length; i++) {
        await uploadSingleFile(filesToUpload[i]);
        setProgress(((i + 1) / filesToUpload.length) * 100);
      }
      
      setFiles(prev => [...prev, ...filesToUpload]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
  }, []);
  
  return {
    files,
    progress,
    error,
    uploadFiles,
    clearError: () => setError(null),
  };
};
```

### Database Guidelines

#### Migration Files
```sql
-- migrations/000001_add_file_tags.up.sql
-- Add file tagging support

CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT tags_name_not_empty CHECK (length(trim(name)) > 0)
);

CREATE TABLE file_tags (
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Composite primary key
    PRIMARY KEY (file_id, tag_id)
);

-- Indexes for performance
CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_file_tags_file_id ON file_tags(file_id);
CREATE INDEX idx_file_tags_tag_id ON file_tags(tag_id);

-- migrations/000001_add_file_tags.down.sql
-- Rollback file tagging support

DROP TABLE IF EXISTS file_tags;
DROP TABLE IF EXISTS tags;
```

## Contribution Process

### Branch Naming
Use descriptive branch names that indicate the type of change:
- `feature/user-authentication` - New features
- `fix/file-upload-error` - Bug fixes
- `docs/api-documentation` - Documentation updates
- `refactor/storage-manager` - Code refactoring
- `test/upload-functionality` - Test additions

### Commit Messages
Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```bash
# Format: type(scope): description

# Examples:
feat(auth): add JWT token refresh functionality
fix(upload): resolve file size validation issue
docs(api): update GraphQL schema documentation
refactor(storage): improve file deduplication logic
test(auth): add authentication middleware tests
```

### Pull Request Guidelines

#### PR Title and Description
```markdown
# PR Title Format
feat(scope): brief description of changes

# PR Description Template
## Summary
Brief description of what this PR does and why.

## Changes
- [ ] Added new feature X
- [ ] Fixed bug Y
- [ ] Updated documentation Z

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Breaking Changes
List any breaking changes and migration steps.

## Screenshots/Demo
Include screenshots or GIFs for UI changes.
```

#### Checklist
Before submitting a PR, ensure:
- [ ] Code follows style guidelines
- [ ] Tests are added for new functionality
- [ ] All tests pass
- [ ] Documentation is updated
- [ ] No breaking changes (or properly documented)
- [ ] Commits are properly formatted
- [ ] PR description is clear and complete

## Testing Requirements

### Backend Tests
```bash
# Run all tests
go test ./... -v

# Run tests with coverage
go test ./... -coverprofile=coverage.out
go tool cover -html=coverage.out -o coverage.html

# Run specific test
go test ./internal/auth -v -run TestValidateToken

# Benchmark tests
go test ./internal/storage -bench=BenchmarkHashCalculation
```

#### Test Structure
```go
func TestUserService_CreateUser(t *testing.T) {
    // Setup
    db := setupTestDB(t)
    service := NewUserService(db)
    
    // Test cases
    tests := []struct {
        name    string
        input   CreateUserInput
        want    *User
        wantErr bool
    }{
        {
            name: "valid user creation",
            input: CreateUserInput{
                Email:    "test@example.com",
                Password: "securepassword",
                Name:     "Test User",
            },
            want: &User{
                Email: "test@example.com",
                Name:  "Test User",
                Role:  "user",
            },
            wantErr: false,
        },
        // More test cases...
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            // Execute
            got, err := service.CreateUser(tt.input)
            
            // Assert
            if tt.wantErr {
                assert.Error(t, err)
                return
            }
            
            assert.NoError(t, err)
            assert.Equal(t, tt.want.Email, got.Email)
            assert.Equal(t, tt.want.Name, got.Name)
            assert.NotEmpty(t, got.ID)
        })
    }
}
```

### Frontend Tests
```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage --watchAll=false

# Run specific test file
npm test -- --testPathPattern=FileUpload.test.tsx

# Run e2e tests
npm run test:e2e
```

#### Component Testing
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { FileUpload } from './FileUpload';

describe('FileUpload Component', () => {
  const mockProps = {
    onUpload: jest.fn(),
    maxSize: 10 * 1024 * 1024,
    multiple: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render upload area', () => {
    render(
      <MockedProvider>
        <FileUpload {...mockProps} />
      </MockedProvider>
    );
    
    expect(screen.getByText(/drag and drop files/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /browse files/i })).toBeInTheDocument();
  });

  it('should handle file drop', async () => {
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    
    render(
      <MockedProvider>
        <FileUpload {...mockProps} />
      </MockedProvider>
    );
    
    const dropzone = screen.getByTestId('file-dropzone');
    
    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [file],
      },
    });
    
    await waitFor(() => {
      expect(mockProps.onUpload).toHaveBeenCalledWith([file]);
    });
  });
});
```

## Documentation Standards

### Code Documentation
- **Go**: Use GoDoc format for all public functions, types, and packages
- **TypeScript**: Use JSDoc format for components, functions, and interfaces
- **SQL**: Comment complex queries and migrations

### README Updates
When adding new features, update:
- Feature list in main README
- API documentation if applicable
- Setup instructions if needed
- Examples and usage

### API Documentation
For GraphQL schema changes:
- Update schema.graphqls with proper descriptions
- Add examples in API.md
- Update TypeScript types if needed

## Security Guidelines

### Secure Coding Practices

#### Input Validation
```go
// Good: Validate all inputs
func CreateUser(email, password, name string) (*User, error) {
    // Validate email format
    if !isValidEmail(email) {
        return nil, fmt.Errorf("invalid email format")
    }
    
    // Validate password strength
    if len(password) < 8 {
        return nil, fmt.Errorf("password must be at least 8 characters")
    }
    
    // Sanitize name input
    name = strings.TrimSpace(name)
    if len(name) == 0 {
        return nil, fmt.Errorf("name cannot be empty")
    }
    
    // Hash password securely
    hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
    if err != nil {
        return nil, fmt.Errorf("failed to hash password: %w", err)
    }
    
    return &User{
        Email:        email,
        PasswordHash: string(hashedPassword),
        Name:         name,
        Role:         "user",
    }, nil
}
```

#### SQL Injection Prevention
```go
// Good: Use parameterized queries
func GetFilesByOwner(db *sql.DB, ownerID string) ([]File, error) {
    query := `
        SELECT id, name, size, created_at 
        FROM files 
        WHERE owner_id = $1 
        ORDER BY created_at DESC
    `
    
    rows, err := db.Query(query, ownerID)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    
    // Process results...
}

// Bad: String concatenation (vulnerable to SQL injection)
func GetFilesByOwner(db *sql.DB, ownerID string) ([]File, error) {
    query := "SELECT * FROM files WHERE owner_id = '" + ownerID + "'"
    // This is vulnerable to SQL injection!
}
```

### Sensitive Data Handling
- Never log passwords or tokens
- Use environment variables for secrets
- Sanitize error messages for external APIs
- Validate file uploads thoroughly

```go
// Good: Safe error handling
func AuthenticateUser(email, password string) (*User, error) {
    user, err := getUserByEmail(email)
    if err != nil {
        log.Printf("Database error during authentication: %v", err)
        return nil, fmt.Errorf("authentication failed")
    }
    
    if user == nil || !checkPassword(password, user.PasswordHash) {
        return nil, fmt.Errorf("invalid credentials")
    }
    
    return user, nil
}
```

## Review Process

### Code Review Guidelines

#### As a Reviewer
- **Be Constructive**: Provide helpful feedback with suggestions
- **Check Logic**: Verify the code logic and edge case handling
- **Validate Tests**: Ensure adequate test coverage
- **Security Review**: Look for potential security issues
- **Performance**: Consider performance implications

#### Review Checklist
- [ ] Code follows style guidelines
- [ ] Logic is correct and handles edge cases
- [ ] Tests are comprehensive and pass
- [ ] Documentation is updated
- [ ] Security considerations addressed
- [ ] Performance impact considered
- [ ] No hardcoded secrets or credentials

#### Feedback Format
```markdown
# Constructive feedback format

## Suggestion
Consider using a more descriptive variable name here:

```go
// Instead of:
var d time.Duration

// Consider:
var requestTimeout time.Duration
```

## Question
Why did you choose this approach over using the existing utility function?

## Praise
Great job adding comprehensive error handling here!
```

### Response to Reviews
- **Address All Comments**: Respond to each review comment
- **Ask Questions**: Clarify unclear feedback
- **Make Changes**: Update code based on feedback
- **Test Changes**: Ensure fixes don't break anything
- **Re-request Review**: When ready for another review

## Additional Resources

### Useful Tools
- **Go**: gofmt, golangci-lint, govulncheck
- **JavaScript/TypeScript**: ESLint, Prettier, TypeScript compiler
- **Database**: migrate, psql, pgAdmin
- **Testing**: Testify (Go), Jest/React Testing Library (JS)

### Learning Resources
- [Effective Go](https://golang.org/doc/effective_go.html)
- [React TypeScript Best Practices](https://react-typescript-cheatsheet.netlify.app/)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)
- [PostgreSQL Performance Tips](https://www.postgresql.org/docs/current/performance-tips.html)

### Community
- Join our discussions for questions and ideas
- Follow coding standards and best practices
- Help others with code reviews and mentoring
- Contribute to documentation and examples

---

Thank you for contributing to FileVault! Your contributions help make this project better for everyone.
