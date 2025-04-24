package main

import (
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

	err := app.writeJSON(responseWriter, http.StatusOK, user, nil)

	if err != nil {
		return
	}

}
