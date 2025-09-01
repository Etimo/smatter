package main

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"etimo.smatter.backend/internal/data"
	"github.com/julienschmidt/httprouter"
)

// LoginRequest represents a login request
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// SignupRequest represents a signup request  
type SignupRequest struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	Username    string `json:"username"`
	DisplayName string `json:"displayName"`
}

// LoginResponse represents a successful login response
type LoginResponse struct {
	ID       string `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
}

// ValidationResponse represents a session validation response
type ValidationResponse struct {
	UserID      string `json:"userId"`
	Username    string `json:"username"`
	Email       string `json:"email"`
	DisplayName string `json:"displayName"`
}

// loginHandler handles user login
func (app *application) loginHandler(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		app.badRequestResponse(w, r, errors.New("invalid JSON body"))
		return
	}

	// Validate input
	if strings.TrimSpace(req.Email) == "" {
		app.badRequestResponse(w, r, errors.New("email is required"))
		return
	}
	if strings.TrimSpace(req.Password) == "" {
		app.badRequestResponse(w, r, errors.New("password is required"))
		return
	}

	// Get user repository
	userRepo := data.NewUserRepository(app.db)

	// Find user by email
	user, err := userRepo.GetByEmail(r.Context(), req.Email)
	if err != nil {
		app.logger.Error("failed to get user by email", "error", err)
		app.serverErrorResponse(w, r, err)
		return
	}

	if user == nil || !user.ValidatePassword(req.Password) {
		app.unauthorizedResponse(w, r)
		return
	}

	// Create session
	sessionRepo := data.NewSessionRepository(app.redis)
	sessionToken, err := sessionRepo.Create(r.Context(), user, r.UserAgent(), app.getClientIP(r))
	if err != nil {
		app.logger.Error("failed to create session", "error", err)
		app.serverErrorResponse(w, r, err)
		return
	}

	// Set secure cookie
	app.setSessionCookie(w, sessionToken)

	// Log successful login
	app.logger.Info("user logged in", "userID", user.ID.Hex(), "email", user.Email)

	// Return user data
	response := LoginResponse{
		ID:       user.ID.Hex(),
		Username: user.Username,
		Email:    user.Email,
	}

	err = app.writeJSON(w, http.StatusOK, response, nil)
	if err != nil {
		app.serverErrorResponse(w, r, err)
	}
}

// signupHandler handles user registration
func (app *application) signupHandler(w http.ResponseWriter, r *http.Request) {
	var req SignupRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		app.badRequestResponse(w, r, errors.New("invalid JSON body"))
		return
	}

	// Convert to user creation request
	createReq := data.CreateUserRequest{
		Username:    req.Username,
		Email:       req.Email,
		Password:    req.Password,
		DisplayName: req.DisplayName,
	}

	// Get user repository
	userRepo := data.NewUserRepository(app.db)

	// Create user
	user, err := userRepo.Create(r.Context(), createReq)
	if err != nil {
		if strings.Contains(err.Error(), "already exists") {
			app.badRequestResponse(w, r, err)
			return
		}
		if strings.Contains(err.Error(), "required") || 
		   strings.Contains(err.Error(), "invalid") ||
		   strings.Contains(err.Error(), "must be") {
			app.badRequestResponse(w, r, err)
			return
		}
		app.logger.Error("failed to create user", "error", err)
		app.serverErrorResponse(w, r, err)
		return
	}

	// Create session
	sessionRepo := data.NewSessionRepository(app.redis)
	sessionToken, err := sessionRepo.Create(r.Context(), user, r.UserAgent(), app.getClientIP(r))
	if err != nil {
		app.logger.Error("failed to create session after signup", "error", err)
		app.serverErrorResponse(w, r, err)
		return
	}

	// Set secure cookie
	app.setSessionCookie(w, sessionToken)

	// Log successful signup
	app.logger.Info("user signed up", "userID", user.ID.Hex(), "email", user.Email)

	// Return user data
	response := LoginResponse{
		ID:       user.ID.Hex(),
		Username: user.Username,
		Email:    user.Email,
	}

	err = app.writeJSON(w, http.StatusOK, response, nil)
	if err != nil {
		app.serverErrorResponse(w, r, err)
	}
}

// logoutHandler handles user logout
func (app *application) logoutHandler(w http.ResponseWriter, r *http.Request) {
	// Get session token from cookie
	sessionToken := app.getSessionToken(r)
	if sessionToken != "" {
		// Delete session from Redis
		sessionRepo := data.NewSessionRepository(app.redis)
		err := sessionRepo.Delete(r.Context(), sessionToken)
		if err != nil {
			app.logger.Error("failed to delete session during logout", "error", err)
			// Continue with logout even if session deletion fails
		}
	}

	// Clear cookie
	app.clearSessionCookie(w)

	// Return empty response
	err := app.writeJSON(w, http.StatusOK, map[string]interface{}{}, nil)
	if err != nil {
		app.serverErrorResponse(w, r, err)
	}
}

// meHandler returns current user information
func (app *application) meHandler(w http.ResponseWriter, r *http.Request) {
	// Get user from context (set by auth middleware)
	sessionData, ok := r.Context().Value(contextKeyUser).(*data.SessionData)
	if !ok {
		app.unauthorizedResponse(w, r)
		return
	}

	response := LoginResponse{
		ID:       sessionData.UserID,
		Username: sessionData.Username,
		Email:    sessionData.Email,
	}

	err := app.writeJSON(w, http.StatusOK, response, nil)
	if err != nil {
		app.serverErrorResponse(w, r, err)
	}
}

// validateSessionHandler validates a session token (internal API)
func (app *application) validateSessionHandler(w http.ResponseWriter, r *http.Request) {
	// Get session token from Authorization header
	authHeader := r.Header.Get("Authorization")
	if !strings.HasPrefix(authHeader, "Bearer ") {
		app.unauthorizedResponse(w, r)
		return
	}

	sessionToken := strings.TrimPrefix(authHeader, "Bearer ")
	if !data.ValidateTokenFormat(sessionToken) {
		app.unauthorizedResponse(w, r)
		return
	}

	// Validate session
	sessionRepo := data.NewSessionRepository(app.redis)
	sessionData, err := sessionRepo.Get(r.Context(), sessionToken)
	if err != nil {
		app.logger.Error("failed to validate session", "error", err)
		app.serverErrorResponse(w, r, err)
		return
	}

	if sessionData == nil {
		app.unauthorizedResponse(w, r)
		return
	}

	// Refresh session
	err = sessionRepo.Refresh(r.Context(), sessionToken)
	if err != nil {
		app.logger.Error("failed to refresh session", "error", err)
		// Continue even if refresh fails
	}

	// Return user data for other services
	response := ValidationResponse{
		UserID:      sessionData.UserID,
		Username:    sessionData.Username,
		Email:       sessionData.Email,
		DisplayName: sessionData.DisplayName,
	}

	err = app.writeJSON(w, http.StatusOK, response, nil)
	if err != nil {
		app.serverErrorResponse(w, r, err)
	}
}

// Cookie helper functions

func (app *application) setSessionCookie(w http.ResponseWriter, sessionToken string) {
	cookie := &http.Cookie{
		Name:     "session",
		Value:    sessionToken,
		Path:     "/",
		HttpOnly: true,
		Secure:   app.config.env != "development", // Only secure in production
		SameSite: http.SameSiteStrictMode,
		MaxAge:   int((7 * 24 * time.Hour).Seconds()), // 7 days
	}
	http.SetCookie(w, cookie)
}

func (app *application) clearSessionCookie(w http.ResponseWriter) {
	cookie := &http.Cookie{
		Name:     "session",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   app.config.env != "development",
		SameSite: http.SameSiteStrictMode,
		MaxAge:   -1, // Delete immediately
	}
	http.SetCookie(w, cookie)
}

func (app *application) getSessionToken(r *http.Request) string {
	cookie, err := r.Cookie("session")
	if err != nil {
		return ""
	}
	return cookie.Value
}

func (app *application) getClientIP(r *http.Request) string {
	// Check X-Forwarded-For header first (for load balancers/proxies)
	if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
		// Take the first IP if multiple are present
		ips := strings.Split(forwarded, ",")
		return strings.TrimSpace(ips[0])
	}
	
	// Check X-Real-IP header
	if realIP := r.Header.Get("X-Real-IP"); realIP != "" {
		return realIP
	}
	
	// Fall back to remote address
	return r.RemoteAddr
}