package main

import (
	"fmt"
	"net/http"
)

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
	message := "the server encountered a problem and could not process your request"
	app.errorResponse(w, r, http.StatusInternalServerError, message)
}

func (app *application) notFoundResponse(w http.ResponseWriter, r *http.Request) {
	message := "the requested resource could not be found"
	app.errorResponse(w, r, http.StatusNotFound, message)
}

func (app *application) methodNotAllowedResponse(w http.ResponseWriter, r *http.Request) {
	message := fmt.Sprintf("the %s method is not supported for this resource", r.Method)
	app.errorResponse(w, r, http.StatusMethodNotAllowed, message)
}
