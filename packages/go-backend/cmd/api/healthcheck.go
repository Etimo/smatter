package main

import (
	"encoding/json"
	"net/http"
)

func (app *application) healthcheckHandler(responseWriter http.ResponseWriter, request *http.Request) {

	data := map[string]string{
		"status":      "available",
		"environment": app.config.env,
		"version":     version,
	}

	js, err := json.Marshal(data)

	if err != nil {
		return
	}

	responseWriter.Header().Set("Content-Type", "application/json")

	responseWriter.Write(js)
}
