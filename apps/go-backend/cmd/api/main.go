package main

import (
	"context"
	"flag"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/go-redis/redis/v8"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
	"go.mongodb.org/mongo-driver/v2/mongo/readpref"
)

const version = "1.0.0"

type config struct {
	port      int
	env       string
	mongoURL  string
	redisURL  string
	jwtSecret string
}

type application struct {
	config config
	logger *slog.Logger
	db     *mongo.Client
	redis  *redis.Client
}

func main() {
	var cfg config

	flag.IntVar(&cfg.port, "port", 8080, "API server port")
	flag.StringVar(&cfg.env, "env", "development", "Environment (development|staging|production)")
	flag.Parse()

	// Load configuration from environment variables
	cfg.mongoURL = getEnv("MONGO_URL", "mongodb://fake:fake@127.0.0.1:27017")
	cfg.redisURL = getEnv("REDIS_URL", "localhost:6379")
	cfg.jwtSecret = getEnv("JWT_SECRET", "your-super-secret-key-change-this-in-production")

	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))

	// Connect to MongoDB
	mongoClient, mongoErr := connectToDB(cfg.mongoURL)
	if mongoErr != nil {
		logger.Error("Failed to connect to MongoDB", "error", mongoErr)
		os.Exit(1)
	}

	// Connect to Redis
	redisClient := redis.NewClient(&redis.Options{
		Addr:     cfg.redisURL,
		Password: "",
		DB:       0,
	})

	// Test Redis connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, redisErr := redisClient.Ping(ctx).Result()
	if redisErr != nil {
		logger.Error("Failed to connect to Redis", "error", redisErr)
		os.Exit(1)
	}

	logger.Info("Connected to Redis", "addr", cfg.redisURL)

	// Graceful shutdown
	defer func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		logger.Info("Disconnecting from MongoDB...")
		if err := mongoClient.Disconnect(ctx); err != nil {
			logger.Error("Error disconnecting from MongoDB", "error", err)
		}

		logger.Info("Closing Redis connection...")
		if err := redisClient.Close(); err != nil {
			logger.Error("Error closing Redis connection", "error", err)
		}
	}()

	app := &application{
		config: cfg,
		logger: logger,
		db:     mongoClient,
		redis:  redisClient,
	}

	srv := &http.Server{
		Addr:         fmt.Sprintf(":%d", cfg.port),
		Handler:      app.routes(),
		WriteTimeout: 10 * time.Second,
		ReadTimeout:  5 * time.Second,
		ErrorLog:     slog.NewLogLogger(logger.Handler(), slog.LevelError),
	}

	logger.Info("starting auth service", "addr", srv.Addr, "env", cfg.env)
	err := srv.ListenAndServe()
	logger.Error(err.Error())
	os.Exit(1)
}

func connectToDB(mongoURL string) (*mongo.Client, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	fmt.Println("Connecting to MongoDB...")

	client, err := mongo.Connect(options.Client().ApplyURI(mongoURL))
	if err != nil {
		return nil, err
	}

	err = client.Ping(ctx, readpref.Primary())
	if err != nil {
		return nil, err
	}

	fmt.Println("Connected to MongoDB!")
	return client, nil
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
