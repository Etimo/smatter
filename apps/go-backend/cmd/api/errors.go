package main

import (
	"fmt"
	"net/http"
)

// ErrorResponse represents a standard error response
type ErrorResponse struct {
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
}

func (app *application) logError(request *http.Request, err error) {
	var (
		method = request.Method
		uri    = request.URL.RequestURI()
	)

	app.logger.Error(err.Error(), "method", method, "uri", uri)
}

func (app *application) errorResponse(responseWriter http.ResponseWriter, request *http.Request, status int, message any) {
	err := app.writeJSON(responseWriter, status, message, nil)
	if err != nil {
		app.logError(request, err)
		responseWriter.WriteHeader(500)
	}
}

func (app *application) serverErrorResponse(w http.ResponseWriter, r *http.Request, err error) {
	app.logError(r, err)
	
	response := ErrorResponse{
		Message: "the server encountered a problem and could not process your request",
	}
	
	app.errorResponse(w, r, http.StatusInternalServerError, response)
}

func (app *application) notFoundResponse(w http.ResponseWriter, r *http.Request) {
	response := ErrorResponse{
		Message: "the requested resource could not be found",
	}
	
	app.errorResponse(w, r, http.StatusNotFound, response)
}

func (app *application) methodNotAllowedResponse(w http.ResponseWriter, r *http.Request) {
	response := ErrorResponse{
		Message: fmt.Sprintf("the %s method is not supported for this resource", r.Method),
	}
	
	app.errorResponse(w, r, http.StatusMethodNotAllowed, response)
}

func (app *application) badRequestResponse(w http.ResponseWriter, r *http.Request, err error) {
	response := ErrorResponse{
		Message: err.Error(),
	}
	
	app.errorResponse(w, r, http.StatusBadRequest, response)
}

func (app *application) unauthorizedResponse(w http.ResponseWriter, r *http.Request) {
	response := ErrorResponse{
		Message: "you must be authenticated to access this resource",
	}
	
	app.errorResponse(w, r, http.StatusUnauthorized, response)
}

func (app *application) forbiddenResponse(w http.ResponseWriter, r *http.Request) {
	response := ErrorResponse{
		Message: "you don't have permission to access this resource",
	}
	
	app.errorResponse(w, r, http.StatusForbidden, response)
}
