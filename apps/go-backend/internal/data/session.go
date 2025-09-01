package data

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"time"

	"github.com/go-redis/redis/v8"
)

// SessionData represents session information stored in Redis
type SessionData struct {
	UserID      string    `json:"userId"`
	Username    string    `json:"username"`
	Email       string    `json:"email"`
	CreatedAt   time.Time `json:"createdAt"`
	LastAccess  time.Time `json:"lastAccess"`
	UserAgent   string    `json:"userAgent"`
	IPAddress   string    `json:"ipAddress"`
	DisplayName string    `json:"displayName"`
}

// SessionRepository handles session storage operations in Redis
type SessionRepository struct {
	redis  *redis.Client
	expiry time.Duration
}

// NewSessionRepository creates a new session repository
func NewSessionRepository(redisClient *redis.Client) *SessionRepository {
	return &SessionRepository{
		redis:  redisClient,
		expiry: 7 * 24 * time.Hour, // 7 days
	}
}

// Create creates a new session and returns the session token
func (r *SessionRepository) Create(ctx context.Context, user *User, userAgent, ipAddress string) (string, error) {
	// Generate cryptographically secure session token
	sessionToken, err := generateSecureToken()
	if err != nil {
		return "", fmt.Errorf("failed to generate session token: %w", err)
	}

	sessionData := SessionData{
		UserID:      user.ID.Hex(),
		Username:    user.Username,
		Email:       user.Email,
		DisplayName: user.DisplayName,
		CreatedAt:   time.Now(),
		LastAccess:  time.Now(),
		UserAgent:   userAgent,
		IPAddress:   ipAddress,
	}

	// Serialize session data
	data, err := json.Marshal(sessionData)
	if err != nil {
		return "", fmt.Errorf("failed to serialize session data: %w", err)
	}

	// Store in Redis with expiration
	key := r.sessionKey(sessionToken)
	err = r.redis.SetEX(ctx, key, data, r.expiry).Err()
	if err != nil {
		return "", fmt.Errorf("failed to store session: %w", err)
	}

	return sessionToken, nil
}

// Get retrieves session data by token
func (r *SessionRepository) Get(ctx context.Context, sessionToken string) (*SessionData, error) {
	key := r.sessionKey(sessionToken)
	data, err := r.redis.Get(ctx, key).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, nil // Session not found
		}
		return nil, fmt.Errorf("failed to retrieve session: %w", err)
	}

	var sessionData SessionData
	err = json.Unmarshal([]byte(data), &sessionData)
	if err != nil {
		return nil, fmt.Errorf("failed to deserialize session data: %w", err)
	}

	return &sessionData, nil
}

// Refresh updates the session's last access time and extends expiration
func (r *SessionRepository) Refresh(ctx context.Context, sessionToken string) error {
	key := r.sessionKey(sessionToken)
	
	// Get current session data
	data, err := r.redis.Get(ctx, key).Result()
	if err != nil {
		if err == redis.Nil {
			return fmt.Errorf("session not found")
		}
		return fmt.Errorf("failed to retrieve session for refresh: %w", err)
	}

	var sessionData SessionData
	err = json.Unmarshal([]byte(data), &sessionData)
	if err != nil {
		return fmt.Errorf("failed to deserialize session data: %w", err)
	}

	// Update last access time
	sessionData.LastAccess = time.Now()

	// Serialize updated data
	updatedData, err := json.Marshal(sessionData)
	if err != nil {
		return fmt.Errorf("failed to serialize updated session data: %w", err)
	}

	// Update in Redis with extended expiration
	err = r.redis.SetEX(ctx, key, updatedData, r.expiry).Err()
	if err != nil {
		return fmt.Errorf("failed to refresh session: %w", err)
	}

	return nil
}

// Delete removes a session
func (r *SessionRepository) Delete(ctx context.Context, sessionToken string) error {
	key := r.sessionKey(sessionToken)
	err := r.redis.Del(ctx, key).Err()
	if err != nil {
		return fmt.Errorf("failed to delete session: %w", err)
	}
	return nil
}

// DeleteByUserID removes all sessions for a specific user
func (r *SessionRepository) DeleteByUserID(ctx context.Context, userID string) error {
	// Find all sessions for this user
	pattern := "session:*"
	keys, err := r.redis.Keys(ctx, pattern).Result()
	if err != nil {
		return fmt.Errorf("failed to find sessions: %w", err)
	}

	var sessionsToDelete []string
	for _, key := range keys {
		data, err := r.redis.Get(ctx, key).Result()
		if err != nil {
			continue // Skip if we can't read the session
		}

		var sessionData SessionData
		if err := json.Unmarshal([]byte(data), &sessionData); err != nil {
			continue // Skip if we can't parse the session
		}

		if sessionData.UserID == userID {
			sessionsToDelete = append(sessionsToDelete, key)
		}
	}

	// Delete found sessions
	if len(sessionsToDelete) > 0 {
		err = r.redis.Del(ctx, sessionsToDelete...).Err()
		if err != nil {
			return fmt.Errorf("failed to delete user sessions: %w", err)
		}
	}

	return nil
}

// GetUserSessions retrieves all active sessions for a user
func (r *SessionRepository) GetUserSessions(ctx context.Context, userID string) ([]SessionData, error) {
	pattern := "session:*"
	keys, err := r.redis.Keys(ctx, pattern).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to find sessions: %w", err)
	}

	var userSessions []SessionData
	for _, key := range keys {
		data, err := r.redis.Get(ctx, key).Result()
		if err != nil {
			continue // Skip if we can't read the session
		}

		var sessionData SessionData
		if err := json.Unmarshal([]byte(data), &sessionData); err != nil {
			continue // Skip if we can't parse the session
		}

		if sessionData.UserID == userID {
			userSessions = append(userSessions, sessionData)
		}
	}

	return userSessions, nil
}

// CleanupExpired removes expired sessions (Redis handles this automatically, but this can be used for manual cleanup)
func (r *SessionRepository) CleanupExpired(ctx context.Context) error {
	// Redis automatically handles expiration, but we can implement manual cleanup if needed
	// This is useful for getting statistics or manual maintenance
	pattern := "session:*"
	keys, err := r.redis.Keys(ctx, pattern).Result()
	if err != nil {
		return fmt.Errorf("failed to find sessions for cleanup: %w", err)
	}

	expiredCount := 0
	for _, key := range keys {
		ttl := r.redis.TTL(ctx, key).Val()
		if ttl < 0 {
			// Key exists but has no expiration set, or has expired
			r.redis.Del(ctx, key)
			expiredCount++
		}
	}

	return nil
}

// sessionKey generates the Redis key for a session
func (r *SessionRepository) sessionKey(token string) string {
	return "session:" + token
}

// generateSecureToken generates a cryptographically secure random token
func generateSecureToken() (string, error) {
	bytes := make([]byte, 32) // 256 bits
	_, err := rand.Read(bytes)
	if err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// ValidateTokenFormat checks if a token has the correct format
func ValidateTokenFormat(token string) bool {
	if len(token) != 64 { // 32 bytes = 64 hex characters
		return false
	}
	// Check if it's valid hex
	_, err := hex.DecodeString(token)
	return err == nil
}