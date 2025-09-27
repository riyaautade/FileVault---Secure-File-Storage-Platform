package graph

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/BalkanID-University/vit-2026-capstone-internship-hiring-task-riyaautade/backend/internal/auth"
	"github.com/BalkanID-University/vit-2026-capstone-internship-hiring-task-riyaautade/backend/internal/db"
)

type contextKey string

const UserContextKey contextKey = "user"

// AuthMiddleware extracts the JWT token from the Authorization header
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
			token := strings.TrimPrefix(authHeader, "Bearer ")
			claims, err := auth.ValidateToken(token)
			if err == nil {
				// Get user from database
				var user db.User
				if err := db.DB.First(&user, "id = ?", claims.UserID).Error; err == nil {
					ctx := context.WithValue(r.Context(), UserContextKey, &user)
					r = r.WithContext(ctx)
				}
			}
		}
		next.ServeHTTP(w, r)
	})
}

// GetUserFromContext retrieves the authenticated user from context
func GetUserFromContext(ctx context.Context) (*db.User, error) {
	user, ok := ctx.Value(UserContextKey).(*db.User)
	if !ok || user == nil {
		return nil, errors.New("user not authenticated")
	}
	return user, nil
}

// RequireAuth ensures the user is authenticated
func RequireAuth(ctx context.Context) (*db.User, error) {
	return GetUserFromContext(ctx)
}

// RequireAdmin ensures the user is authenticated and is an admin
func RequireAdmin(ctx context.Context) (*db.User, error) {
	user, err := GetUserFromContext(ctx)
	if err != nil {
		return nil, err
	}
	if user.Role != "admin" {
		return nil, errors.New("admin access required")
	}
	return user, nil
}
