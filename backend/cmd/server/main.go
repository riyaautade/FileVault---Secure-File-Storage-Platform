package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/BalkanID-University/vit-2026-capstone-internship-hiring-task-riyaautade/backend/internal/audit"
	"github.com/BalkanID-University/vit-2026-capstone-internship-hiring-task-riyaautade/backend/internal/db"
	"github.com/BalkanID-University/vit-2026-capstone-internship-hiring-task-riyaautade/backend/internal/graph"
	"github.com/BalkanID-University/vit-2026-capstone-internship-hiring-task-riyaautade/backend/internal/graph/generated"
	"github.com/BalkanID-University/vit-2026-capstone-internship-hiring-task-riyaautade/backend/internal/storage"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
)

func main() {
	// Load environment variables from .env file
	if err := godotenv.Load("../../.env"); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Initialize database connection
	db.Connect()

	// Initialize storage manager
	storagePath := os.Getenv("STORAGE_PATH")
	if storagePath == "" {
		storagePath = "../../uploads" // Default path relative to cmd/server
	}
	storageManager, err := storage.NewStorageManager(storagePath)
	if err != nil {
		log.Fatalf("Failed to initialize storage manager: %v", err)
	}

	// Initialize audit service
	auditService := audit.NewService(db.DB)

	// Create router
	router := chi.NewRouter()

	// Middleware
	router.Use(middleware.Logger)
	router.Use(middleware.Recoverer)
	router.Use(cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:8080"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
	}).Handler)
	router.Use(graph.AuthMiddleware)

	// Create GraphQL handler
	config := generated.Config{Resolvers: &graph.Resolver{
		DB:      db.DB,
		Storage: storageManager,
		Audit:   auditService,
	}}

	srv := handler.New(generated.NewExecutableSchema(config))
	
	// Add WebSocket transport for subscriptions
	srv.AddTransport(transport.Websocket{
		KeepAlivePingInterval: 10 * time.Second,
	})
	srv.AddTransport(transport.Options{})
	srv.AddTransport(transport.GET{})
	srv.AddTransport(transport.POST{})
	srv.AddTransport(transport.MultipartForm{})

	// Routes
	router.Handle("/", playground.Handler("File Vault GraphQL", "/graphql"))
	router.Handle("/graphql", srv)

	// File download endpoint
	router.Get("/download/{fileId}", func(w http.ResponseWriter, r *http.Request) {
		graph.HandleFileDownload(w, r, db.DB, storageManager, auditService)
	})

	// Serve test upload page
	router.Get("/test-upload", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "./test-upload.html")
	})

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server is running on http://localhost:%s", port)
	log.Fatal(http.ListenAndServe(":"+port, router))
}
