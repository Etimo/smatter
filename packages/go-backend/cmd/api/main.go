package main

import (
	"context"
	"flag"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
	"go.mongodb.org/mongo-driver/v2/mongo/readpref"
)

const version = "1.0.0"

type config struct {
	port int
	env  string
}

type application struct {
	config config
	logger *slog.Logger
	db     *mongo.Client
}

func main() {
	var cfg config

	flag.IntVar(&cfg.port, "port", 4000, "API server port")
	flag.StringVar(&cfg.env, "env", "development", "Environment (development|staging|production)")
	flag.Parse()

	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))

	client, connectErr := connectToDB()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	defer func() {
		fmt.Println("Disconnecting from MongoDB...")
		if connectErr = client.Disconnect(ctx); connectErr != nil {
			panic(connectErr)
		}
	}()

	app := &application{
		config: cfg,
		logger: logger,
		db:     client,
	}

	srv := &http.Server{
		Addr:         fmt.Sprintf(":%d", cfg.port),
		Handler:      app.routes(),
		WriteTimeout: 10 * time.Second,
		ReadTimeout:  5 * time.Second,
		ErrorLog:     slog.NewLogLogger(logger.Handler(), slog.LevelError),
	}

	logger.Info("starting server", "addr", srv.Addr, "env", cfg.env)
	err := srv.ListenAndServe()
	logger.Error(err.Error())
	os.Exit(1)
}

func connectToDB() (*mongo.Client, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	fmt.Println("Connecting to MongoDB...")

	uri := "mongodb://fake:fake@127.0.0.1:27017"
	client, err := mongo.Connect(options.Client().ApplyURI(uri))

	_ = client.Ping(ctx, readpref.Primary())
	fmt.Println("Connected to MongoDB!")

	return client, err
}
