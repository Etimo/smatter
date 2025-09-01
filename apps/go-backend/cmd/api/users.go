package main

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"etimo.smatter.backend/internal/data"
	"github.com/julienschmidt/httprouter"
)

// getUsersHandler returns all users (summary format)
func (app *application) getUsersHandler(w http.ResponseWriter, r *http.Request) {
	userRepo := data.NewUserRepository(app.db)
	
	users, err := userRepo.GetAll(r.Context())
	if err != nil {
		app.logger.Error("failed to get all users", "error", err)
		app.serverErrorResponse(w, r, err)
		return
	}

	// Convert to summary format (no sensitive data)
	var summaries []data.UserSummary
	for _, user := range users {
		summaries = append(summaries, user.ToSummary())
	}

	err = app.writeJSON(w, http.StatusOK, summaries, nil)
	if err != nil {
		app.serverErrorResponse(w, r, err)
	}
}

// searchUsersHandler searches for users by username or display name
func (app *application) searchUsersHandler(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("query")
	if strings.TrimSpace(query) == "" {
		app.badRequestResponse(w, r, errors.New("search query must be a non-empty string"))
		return
	}

	userRepo := data.NewUserRepository(app.db)
	
	users, err := userRepo.Search(r.Context(), query)
	if err != nil {
		app.logger.Error("failed to search users", "error", err, "query", query)
		app.serverErrorResponse(w, r, err)
		return
	}

	// Convert to summary format
	var summaries []data.UserSummary
	for _, user := range users {
		summaries = append(summaries, user.ToSummary())
	}

	err = app.writeJSON(w, http.StatusOK, summaries, nil)
	if err != nil {
		app.serverErrorResponse(w, r, err)
	}
}

// getUserHandler returns detailed information about a specific user
func (app *application) getUserHandler(w http.ResponseWriter, r *http.Request) {
	params := httprouter.ParamsFromContext(r.Context())
	userID := params.ByName("id")

	if strings.TrimSpace(userID) == "" {
		app.badRequestResponse(w, r, errors.New("user ID is required"))
		return
	}

	userRepo := data.NewUserRepository(app.db)
	
	user, err := userRepo.GetByID(r.Context(), userID)
	if err != nil {
		if strings.Contains(err.Error(), "invalid") {
			app.badRequestResponse(w, r, err)
			return
		}
		app.logger.Error("failed to get user by ID", "error", err, "userID", userID)
		app.serverErrorResponse(w, r, err)
		return
	}

	if user == nil {
		app.notFoundResponse(w, r)
		return
	}

	// Get current user from context to determine isMyself flag
	sessionData, ok := r.Context().Value(contextKeyUser).(*data.SessionData)
	isMyself := ok && sessionData.UserID == user.ID.Hex()

	// Return detailed user information
	userDetail := user.ToDetail(isMyself)
	
	err = app.writeJSON(w, http.StatusOK, userDetail, nil)
	if err != nil {
		app.serverErrorResponse(w, r, err)
	}
}

// updateUserHandler updates user profile information
func (app *application) updateUserHandler(w http.ResponseWriter, r *http.Request) {
	params := httprouter.ParamsFromContext(r.Context())
	userID := params.ByName("id")

	// Get current user from context
	sessionData, ok := r.Context().Value(contextKeyUser).(*data.SessionData)
	if !ok {
		app.unauthorizedResponse(w, r)
		return
	}

	// Users can only update their own profile
	if sessionData.UserID != userID {
		app.forbiddenResponse(w, r)
		return
	}

	var updateReq data.UpdateUserRequest
	err := json.NewDecoder(r.Body).Decode(&updateReq)
	if err != nil {
		app.badRequestResponse(w, r, errors.New("invalid JSON body"))
		return
	}

	userRepo := data.NewUserRepository(app.db)
	
	updatedUser, err := userRepo.Update(r.Context(), userID, updateReq)
	if err != nil {
		if strings.Contains(err.Error(), "invalid") || 
		   strings.Contains(err.Error(), "required") ||
		   strings.Contains(err.Error(), "cannot be empty") {
			app.badRequestResponse(w, r, err)
			return
		}
		if strings.Contains(err.Error(), "not found") {
			app.notFoundResponse(w, r)
			return
		}
		app.logger.Error("failed to update user", "error", err, "userID", userID)
		app.serverErrorResponse(w, r, err)
		return
	}

	// Return updated user details
	userDetail := updatedUser.ToDetail(true) // Always true since user is updating themselves
	
	err = app.writeJSON(w, http.StatusOK, userDetail, nil)
	if err != nil {
		app.serverErrorResponse(w, r, err)
	}
}
