package realtime

import (
	"context"
	"sync"
	"time"

	"github.com/BalkanID-University/vit-2026-capstone-internship-hiring-task-riyaautade/backend/internal/graph/model"
)

// EventType represents different types of real-time events
type EventType string

const (
	EventFileUploaded  EventType = "FILE_UPLOADED"
	EventFileDeleted   EventType = "FILE_DELETED"
	EventFolderCreated EventType = "FOLDER_CREATED"
	EventFolderDeleted EventType = "FOLDER_DELETED"
	EventFileShared    EventType = "FILE_SHARED"
	EventFolderShared  EventType = "FOLDER_SHARED"
	EventUserJoined    EventType = "USER_JOINED"
	EventUserLeft      EventType = "USER_LEFT"
)

// Publisher manages real-time event subscriptions
type Publisher struct {
	mu          sync.RWMutex
	subscribers map[string][]chan *model.ActivityEvent
	notifications map[string][]chan *model.NotificationEvent
	fileUpdates   []chan *model.File
	folderUpdates []chan *model.Folder
	analyticsUpdates []chan *model.AnalyticsSummary
	userActivity  []chan *model.UserActivity
}

// NewPublisher creates a new event publisher
func NewPublisher() *Publisher {
	return &Publisher{
		subscribers:      make(map[string][]chan *model.ActivityEvent),
		notifications:    make(map[string][]chan *model.NotificationEvent),
		fileUpdates:      make([]chan *model.File, 0),
		folderUpdates:    make([]chan *model.Folder, 0),
		analyticsUpdates: make([]chan *model.AnalyticsSummary, 0),
		userActivity:     make([]chan *model.UserActivity, 0),
	}
}

// Global publisher instance
var GlobalPublisher = NewPublisher()

// SubscribeToActivity subscribes to activity feed events
func (p *Publisher) SubscribeToActivity(ctx context.Context) <-chan *model.ActivityEvent {
	p.mu.Lock()
	defer p.mu.Unlock()

	ch := make(chan *model.ActivityEvent, 10)
	
	// Use a unique key for general activity feed
	key := "activity_feed"
	p.subscribers[key] = append(p.subscribers[key], ch)

	// Clean up when context is done
	go func() {
		<-ctx.Done()
		p.mu.Lock()
		defer p.mu.Unlock()
		
		subscribers := p.subscribers[key]
		for i, sub := range subscribers {
			if sub == ch {
				p.subscribers[key] = append(subscribers[:i], subscribers[i+1:]...)
				close(ch)
				break
			}
		}
	}()

	return ch
}

// SubscribeToNotifications subscribes to user-specific notifications
func (p *Publisher) SubscribeToNotifications(ctx context.Context, userID string) <-chan *model.NotificationEvent {
	p.mu.Lock()
	defer p.mu.Unlock()

	ch := make(chan *model.NotificationEvent, 10)
	p.notifications[userID] = append(p.notifications[userID], ch)

	// Clean up when context is done
	go func() {
		<-ctx.Done()
		p.mu.Lock()
		defer p.mu.Unlock()
		
		subs := p.notifications[userID]
		for i, sub := range subs {
			if sub == ch {
				p.notifications[userID] = append(subs[:i], subs[i+1:]...)
				close(ch)
				break
			}
		}
	}()

	return ch
}

// SubscribeToFileUpdates subscribes to file update events
func (p *Publisher) SubscribeToFileUpdates(ctx context.Context) <-chan *model.File {
	p.mu.Lock()
	defer p.mu.Unlock()

	ch := make(chan *model.File, 10)
	p.fileUpdates = append(p.fileUpdates, ch)

	// Clean up when context is done
	go func() {
		<-ctx.Done()
		p.mu.Lock()
		defer p.mu.Unlock()
		
		for i, sub := range p.fileUpdates {
			if sub == ch {
				p.fileUpdates = append(p.fileUpdates[:i], p.fileUpdates[i+1:]...)
				close(ch)
				break
			}
		}
	}()

	return ch
}

// SubscribeToFolderUpdates subscribes to folder update events
func (p *Publisher) SubscribeToFolderUpdates(ctx context.Context) <-chan *model.Folder {
	p.mu.Lock()
	defer p.mu.Unlock()

	ch := make(chan *model.Folder, 10)
	p.folderUpdates = append(p.folderUpdates, ch)

	// Clean up when context is done
	go func() {
		<-ctx.Done()
		p.mu.Lock()
		defer p.mu.Unlock()
		
		for i, sub := range p.folderUpdates {
			if sub == ch {
				p.folderUpdates = append(p.folderUpdates[:i], p.folderUpdates[i+1:]...)
				close(ch)
				break
			}
		}
	}()

	return ch
}

// PublishActivity publishes an activity event to all subscribers
func (p *Publisher) PublishActivity(event *model.ActivityEvent) {
	p.mu.RLock()
	defer p.mu.RUnlock()

	// Send to activity feed subscribers
	for _, subscribers := range p.subscribers {
		for _, ch := range subscribers {
			select {
			case ch <- event:
			default:
				// Channel is full, skip
			}
		}
	}
}

// PublishNotification publishes a notification to specific user
func (p *Publisher) PublishNotification(userID string, event *model.NotificationEvent) {
	p.mu.RLock()
	defer p.mu.RUnlock()

	if subscribers, exists := p.notifications[userID]; exists {
		for _, ch := range subscribers {
			select {
			case ch <- event:
			default:
				// Channel is full, skip
			}
		}
	}
}

// PublishFileUpdate publishes a file update event
func (p *Publisher) PublishFileUpdate(file *model.File) {
	p.mu.RLock()
	defer p.mu.RUnlock()

	for _, ch := range p.fileUpdates {
		select {
		case ch <- file:
		default:
			// Channel is full, skip
		}
	}
}

// PublishFolderUpdate publishes a folder update event
func (p *Publisher) PublishFolderUpdate(folder *model.Folder) {
	p.mu.RLock()
	defer p.mu.RUnlock()

	for _, ch := range p.folderUpdates {
		select {
		case ch <- folder:
		default:
			// Channel is full, skip
		}
	}
}

// Helper function to create activity events
func CreateActivityEvent(eventType EventType, userID, userName, message string, data interface{}) *model.ActivityEvent {
	return &model.ActivityEvent{
		ID:        time.Now().Format("20060102150405") + userID,
		Type:      model.ActivityType(eventType),
		Message:   message,
		Data:      nil, // Convert data to JSON string if needed
		Timestamp: time.Now(),
		User: &model.User{
			ID:   userID,
			Name: userName,
		},
	}
}

// Helper function to create notification events
func CreateNotificationEvent(userID, notifType, title, message string, data interface{}) *model.NotificationEvent {
	return &model.NotificationEvent{
		ID:        time.Now().Format("20060102150405") + userID,
		UserID:    userID,
		Type:      notifType,
		Title:     title,
		Message:   message,
		Data:      nil, // Convert data to JSON string if needed
		Timestamp: time.Now(),
	}
}