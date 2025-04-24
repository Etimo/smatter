package main

import (
	"encoding/json"
	"fmt"
	"net/http"

	"etimo.smatter.backend/internal/data"
	"github.com/julienschmidt/httprouter"
)

func (app *application) getUserHandler(responseWriter http.ResponseWriter, request *http.Request) {
	fmt.Fprintln(responseWriter, "get user handler")

	params := httprouter.ParamsFromContext(request.Context())

	id := params.ByName("id")

	user := data.User{
		Id:       id,
		Username: "henrikwestoo",
		Email:    "",
		Password: "",
	}

	js, err := json.Marshal(user)

	if err != nil {
		return
	}

	responseWriter.Header().Set("Content-Type", "application/json")
	responseWriter.Write(js)
}
