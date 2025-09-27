// Package auth provides authentication and authorization functionality for the FileVault system.
// This package handles password hashing, JWT token generation and validation,
// and user claims management for secure API access.
package auth

import (
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// Common authentication errors
var (
	// ErrInvalidToken is returned when a JWT token is malformed or invalid
	ErrInvalidToken = errors.New("invalid token")
)

// Claims represents the JWT token payload containing user identity and permissions.
// This structure is embedded in JWT tokens and used throughout the application
// for authentication and authorization decisions.
type Claims struct {
	// UserID uniquely identifies the authenticated user
	UserID uuid.UUID `json:"user_id"`
	
	// Role defines the user's permission level (admin, user, guest)
	Role string `json:"role"`
	
	// RegisteredClaims includes standard JWT claims (exp, iat, etc.)
	jwt.RegisteredClaims
}

// HashPassword creates a secure bcrypt hash of the given password.
// This function uses bcrypt's default cost factor (currently 10) to balance
// security and performance. The resulting hash is safe to store in the database.
//
// Parameters:
//   - password: The plain text password to hash
//
// Returns:
//   - string: The bcrypt hash of the password
//   - error: Any error that occurred during hashing
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}

// CheckPassword verifies that a plain text password matches a bcrypt hash.
// This function is used during login to validate user credentials against
// the stored password hash in the database.
//
// Parameters:
//   - password: The plain text password to verify
//   - hash: The bcrypt hash to compare against
//
// Returns:
//   - error: nil if the password matches, bcrypt.ErrMismatchedHashAndPassword if not
func CheckPassword(password, hash string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
}

// GenerateToken creates a new JWT token for an authenticated user.
// The token includes the user's ID and role, and expires after 24 hours.
// The token is signed using the JWT_SECRET environment variable.
//
// Parameters:
//   - userID: The unique identifier of the user
//   - role: The user's role (admin, user, guest)
//
// Returns:
//   - string: The signed JWT token
//   - error: Any error that occurred during token generation
func GenerateToken(userID uuid.UUID, role string) (string, error) {
	claims := Claims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(os.Getenv("JWT_SECRET")))
}

// ValidateToken parses and validates a JWT token string.
// This function verifies the token signature, expiration, and extracts the user claims.
// It's used by middleware to authenticate API requests.
//
// Parameters:
//   - tokenStr: The JWT token string to validate
//
// Returns:
//   - *Claims: The parsed user claims if the token is valid
//   - error: ErrInvalidToken or any parsing error that occurred
func ValidateToken(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidToken
		}
		return []byte(os.Getenv("JWT_SECRET")), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, ErrInvalidToken
}
