package main

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"etimo.smatter.backend/internal/data"
	"github.com/julienschmidt/httprouter"
	"go.mongodb.org/mongo-driver/v2/bson"
)

func (app *application) getUserHandler(responseWriter http.ResponseWriter, request *http.Request) {
	params := httprouter.ParamsFromContext(request.Context())

	id := params.ByName("id")

	// TODO, put this in a repository
	objID, objectIdParseErr := bson.ObjectIDFromHex(id)
	if objectIdParseErr != nil {
		fmt.Println("Error parsing ObjectID:", objectIdParseErr)
		return
	}
	userCollection := app.db.Database("test").Collection("users")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	fetchedUser := userCollection.FindOne(ctx, bson.M{"_id": objID})

	if fetchedUser.Err() != nil {
		app.notFoundResponse(responseWriter, request)
		return
	}

	var decodedUser data.User
	decodeError := fetchedUser.Decode(&decodedUser)

	if decodeError != nil {
		http.Error(responseWriter, "Failed to decode user", http.StatusInternalServerError)
		return
	}

	user := data.User{
		Username: decodedUser.Username,
		Email:    decodedUser.Email,
	}

	err := app.writeJSON(responseWriter, http.StatusOK, user, nil)

	if err != nil {
		return
	}

}
