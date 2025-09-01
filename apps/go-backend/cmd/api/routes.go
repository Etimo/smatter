package main

import (
	"net/http"

	"github.com/julienschmidt/httprouter"
)

func (app *application) routes() http.Handler {
	router := httprouter.New()

	router.NotFound = http.HandlerFunc(app.notFoundResponse)
	router.MethodNotAllowed = http.HandlerFunc(app.methodNotAllowedResponse)

	// Health check endpoint
	router.HandlerFunc(http.MethodGet, "/v1/healthcheck", app.healthcheckHandler)

	// Public authentication endpoints
	router.HandlerFunc(http.MethodPost, "/auth/login", app.rateLimit(app.loginHandler))
	router.HandlerFunc(http.MethodPost, "/auth/signup", app.rateLimit(app.signupHandler))
	router.HandlerFunc(http.MethodGet, "/auth/logout", app.logoutHandler)

	// Protected authentication endpoints
	router.HandlerFunc(http.MethodGet, "/auth/me", app.authenticate(app.meHandler))

	// Internal service endpoints (for other microservices)
	router.HandlerFunc(http.MethodGet, "/internal/validate-session", app.requireInternalAccess(app.validateSessionHandler))

	// User management endpoints (auth service owns user data)
	router.HandlerFunc(http.MethodGet, "/users", app.authenticate(app.getUsersHandler))
	router.HandlerFunc(http.MethodGet, "/users/search", app.authenticate(app.searchUsersHandler))
	router.HandlerFunc(http.MethodGet, "/users/:id", app.authenticate(app.getUserHandler))
	router.HandlerFunc(http.MethodPut, "/users/:id", app.authenticate(app.updateUserHandler))

	// Apply middleware in the correct order
	return app.recoverPanic(app.enableCORS(app.logRequest(router)))
}
