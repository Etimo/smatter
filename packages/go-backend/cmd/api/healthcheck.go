package main

import (
	"net/http"
)

func (app *application) healthcheckHandler(responseWriter http.ResponseWriter, request *http.Request) {

	data := map[string]string{
		"status":      "available",
		"environment": app.config.env,
		"version":     version,
	}

	err := app.writeJSON(responseWriter, http.StatusOK, data, nil)

	if err != nil {
		return
	}

}
