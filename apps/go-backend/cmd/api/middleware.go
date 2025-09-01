package main

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"etimo.smatter.backend/internal/data"
)

// Context keys for storing user data
type contextKey string

const contextKeyUser = contextKey("user")

// recoverPanic middleware recovers from panics
func (app *application) recoverPanic(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Create a deferred function (which will always be run in the event of a panic
		// as Go unwinds the stack).
		defer func() {
			// Use the builtin recover function to check if there has been a panic or
			// not.
			if err := recover(); err != nil {
				// If there was a panic, set a "Connection: close" header on the
				// response. This acts as a trigger to make Go's HTTP server
				// automatically close the current connection after a response has been
				// sent.
				w.Header().Set("Connection", "close")
				// The value returned by recover() has the type any, so we use
				// fmt.Errorf() to normalize it into an error and call our
				// serverErrorResponse() helper. In turn, this will log the error using
				// our custom Logger type at the ERROR level and send the client a 500
				// Internal Server Error response.
				app.serverErrorResponse(w, r, fmt.Errorf("%s", err))
			}
		}()
		next.ServeHTTP(w, r)
	})
}

// authenticate middleware validates session and sets user context
func (app *application) authenticate(next http.HandlerFunc) http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Skip authentication for OPTIONS requests
		if r.Method == http.MethodOptions {
			next.ServeHTTP(w, r)
			return
		}

		// Get session token from cookie
		sessionToken := app.getSessionToken(r)
		if sessionToken == "" {
			app.unauthorizedResponse(w, r)
			return
		}

		// Validate token format
		if !data.ValidateTokenFormat(sessionToken) {
			app.unauthorizedResponse(w, r)
			return
		}

		// Get session from Redis
		sessionRepo := data.NewSessionRepository(app.redis)
		sessionData, err := sessionRepo.Get(r.Context(), sessionToken)
		if err != nil {
			app.logger.Error("failed to get session", "error", err)
			app.serverErrorResponse(w, r, err)
			return
		}

		if sessionData == nil {
			app.unauthorizedResponse(w, r)
			return
		}

		// Refresh session access time
		err = sessionRepo.Refresh(r.Context(), sessionToken)
		if err != nil {
			app.logger.Error("failed to refresh session", "error", err)
			// Continue even if refresh fails
		}

		// Add session data to request context
		ctx := context.WithValue(r.Context(), contextKeyUser, sessionData)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// enableCORS middleware adds CORS headers
func (app *application) enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173") // React dev server
		w.Header().Set("Access-Control-Allow-Methods", "OPTIONS,GET,HEAD,PUT,PATCH,POST,DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "cookie,content-type,authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Expose-Headers", "*")

		// Handle preflight requests
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// rateLimit middleware implements simple rate limiting (basic implementation)
func (app *application) rateLimit(next http.HandlerFunc) http.HandlerFunc {
	// In a real implementation, you'd use Redis or an in-memory store
	// This is a simplified version for demonstration
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// For now, just pass through - implement proper rate limiting later
		next.ServeHTTP(w, r)
	})
}

// logRequest middleware logs incoming requests
func (app *application) logRequest(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Create a response writer wrapper to capture status code
		lrw := &logResponseWriter{ResponseWriter: w, statusCode: http.StatusOK}

		next.ServeHTTP(lrw, r)

		duration := time.Since(start)

		app.logger.Info("request completed",
			"method", r.Method,
			"path", r.URL.Path,
			"status", lrw.statusCode,
			"duration", duration,
			"ip", app.getClientIP(r),
			"userAgent", r.UserAgent(),
		)
	})
}

// logResponseWriter wraps http.ResponseWriter to capture status code
type logResponseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (lrw *logResponseWriter) WriteHeader(code int) {
	lrw.statusCode = code
	lrw.ResponseWriter.WriteHeader(code)
}

// requireInternalAccess ensures the request is coming from internal services
// This is a simple implementation - in production you'd use proper service mesh auth
func (app *application) requireInternalAccess(next http.HandlerFunc) http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Check for internal service header or IP range
		// For now, we'll allow any request to internal endpoints
		// In production, you'd implement proper service-to-service auth
		
		// You could check for:
		// - Specific headers set by your internal services
		// - IP ranges (internal network)
		// - Service certificates
		// - API keys for internal services
		
		next.ServeHTTP(w, r)
	})
}
