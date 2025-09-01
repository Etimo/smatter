package data

import (
	"context"
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
	"golang.org/x/crypto/bcrypt"
)

// User represents a user in the system
type User struct {
	ID             bson.ObjectID  `bson:"_id,omitempty" json:"id"`
	Username       string         `bson:"username" json:"username"`
	Email          string         `bson:"email" json:"email"`
	Password       string         `bson:"password" json:"-"` // Never serialize password
	Bio            *string        `bson:"bio,omitempty" json:"bio,omitempty"`
	ProfilePicture *string        `bson:"profilePictureUrl,omitempty" json:"profilePictureUrl,omitempty"`
	BannerPicture  *string        `bson:"bannerPictureUrl,omitempty" json:"bannerPictureUrl,omitempty"`
	DisplayName    string         `bson:"displayName" json:"displayName"`
	CreatedAt      time.Time      `bson:"createdAt" json:"createdAt"`
	UpdatedAt      time.Time      `bson:"updatedAt" json:"updatedAt"`
}

// CreateUserRequest represents the data needed to create a new user
type CreateUserRequest struct {
	Username    string `json:"username"`
	Email       string `json:"email"`
	Password    string `json:"password"`
	DisplayName string `json:"displayName"`
}

// UpdateUserRequest represents the data that can be updated for a user
type UpdateUserRequest struct {
	Email          *string `json:"email,omitempty"`
	Bio            *string `json:"bio,omitempty"`
	ProfilePicture *string `json:"profilePictureUrl,omitempty"`
	BannerPicture  *string `json:"bannerPictureUrl,omitempty"`
	DisplayName    *string `json:"displayName,omitempty"`
}

// UserSummary represents a minimal user for listings
type UserSummary struct {
	ID       string `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
}

// UserDetail represents full user details for profile pages
type UserDetail struct {
	UserSummary
	IsMyself       bool    `json:"isMyself"`
	Bio            *string `json:"bio,omitempty"`
	ProfilePicture *string `json:"profilePictureUrl,omitempty"`
	BannerPicture  *string `json:"bannerPictureUrl,omitempty"`
	DisplayName    string  `json:"displayName"`
}

// UserRepository handles user database operations
type UserRepository struct {
	db         *mongo.Client
	collection *mongo.Collection
}

// NewUserRepository creates a new user repository
func NewUserRepository(db *mongo.Client) *UserRepository {
	collection := db.Database("smatter").Collection("users")
	return &UserRepository{
		db:         db,
		collection: collection,
	}
}

// Create creates a new user with hashed password
func (r *UserRepository) Create(ctx context.Context, req CreateUserRequest) (*User, error) {
	// Validate input
	if err := validateCreateUserRequest(req); err != nil {
		return nil, err
	}

	// Check if user already exists
	exists, err := r.emailExists(ctx, req.Email)
	if err != nil {
		return nil, fmt.Errorf("failed to check email existence: %w", err)
	}
	if exists {
		return nil, errors.New("user with this email already exists")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), 12)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Create user
	user := &User{
		Username:    req.Username,
		Email:       strings.ToLower(req.Email),
		Password:    string(hashedPassword),
		DisplayName: req.DisplayName,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	result, err := r.collection.InsertOne(ctx, user)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	user.ID = result.InsertedID.(bson.ObjectID)
	return user, nil
}

// GetByEmail retrieves a user by email
func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*User, error) {
	var user User
	err := r.collection.FindOne(ctx, bson.M{"email": strings.ToLower(email)}).Decode(&user)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get user by email: %w", err)
	}
	return &user, nil
}

// GetByID retrieves a user by ID
func (r *UserRepository) GetByID(ctx context.Context, id string) (*User, error) {
	objectID, err := bson.ObjectIDFromHex(id)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID format: %w", err)
	}

	var user User
	err = r.collection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&user)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get user by ID: %w", err)
	}
	return &user, nil
}

// GetAll retrieves all users
func (r *UserRepository) GetAll(ctx context.Context) ([]User, error) {
	cursor, err := r.collection.Find(ctx, bson.M{})
	if err != nil {
		return nil, fmt.Errorf("failed to find users: %w", err)
	}
	defer cursor.Close(ctx)

	var users []User
	if err = cursor.All(ctx, &users); err != nil {
		return nil, fmt.Errorf("failed to decode users: %w", err)
	}

	return users, nil
}

// Search searches for users by username or display name
func (r *UserRepository) Search(ctx context.Context, query string) ([]User, error) {
	filter := bson.M{
		"$or": []bson.M{
			{"username": bson.M{"$regex": query, "$options": "i"}},
			{"displayName": bson.M{"$regex": query, "$options": "i"}},
		},
	}

	cursor, err := r.collection.Find(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("failed to search users: %w", err)
	}
	defer cursor.Close(ctx)

	var users []User
	if err = cursor.All(ctx, &users); err != nil {
		return nil, fmt.Errorf("failed to decode search results: %w", err)
	}

	return users, nil
}

// Update updates a user's profile
func (r *UserRepository) Update(ctx context.Context, userID string, req UpdateUserRequest) (*User, error) {
	objectID, err := bson.ObjectIDFromHex(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID format: %w", err)
	}

	// Build update document
	update := bson.M{
		"$set": bson.M{
			"updatedAt": time.Now(),
		},
	}

	if req.Email != nil {
		// Validate email format
		if !isValidEmail(*req.Email) {
			return nil, errors.New("invalid email format")
		}
		update["$set"].(bson.M)["email"] = strings.ToLower(*req.Email)
	}
	if req.Bio != nil {
		update["$set"].(bson.M)["bio"] = *req.Bio
	}
	if req.ProfilePicture != nil {
		update["$set"].(bson.M)["profilePictureUrl"] = *req.ProfilePicture
	}
	if req.BannerPicture != nil {
		update["$set"].(bson.M)["bannerPictureUrl"] = *req.BannerPicture
	}
	if req.DisplayName != nil {
		if strings.TrimSpace(*req.DisplayName) == "" {
			return nil, errors.New("display name cannot be empty")
		}
		update["$set"].(bson.M)["displayName"] = *req.DisplayName
	}

	result, err := r.collection.UpdateOne(ctx, bson.M{"_id": objectID}, update)
	if err != nil {
		return nil, fmt.Errorf("failed to update user: %w", err)
	}

	if result.MatchedCount == 0 {
		return nil, errors.New("user not found")
	}

	// Return updated user
	return r.GetByID(ctx, userID)
}

// ValidatePassword checks if the provided password matches the user's password
func (u *User) ValidatePassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
	return err == nil
}

// ToSummary converts a User to UserSummary
func (u *User) ToSummary() UserSummary {
	return UserSummary{
		ID:       u.ID.Hex(),
		Username: u.Username,
		Email:    u.Email,
	}
}

// ToDetail converts a User to UserDetail
func (u *User) ToDetail(isMyself bool) UserDetail {
	return UserDetail{
		UserSummary:    u.ToSummary(),
		IsMyself:       isMyself,
		Bio:            u.Bio,
		ProfilePicture: u.ProfilePicture,
		BannerPicture:  u.BannerPicture,
		DisplayName:    u.DisplayName,
	}
}

// emailExists checks if a user with the given email already exists
func (r *UserRepository) emailExists(ctx context.Context, email string) (bool, error) {
	count, err := r.collection.CountDocuments(ctx, bson.M{"email": strings.ToLower(email)})
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// validateCreateUserRequest validates the create user request
func validateCreateUserRequest(req CreateUserRequest) error {
	if strings.TrimSpace(req.Username) == "" {
		return errors.New("username is required")
	}
	if len(req.Username) > 20 {
		return errors.New("username must be 20 characters or less")
	}
	if strings.TrimSpace(req.Email) == "" {
		return errors.New("email is required")
	}
	if !isValidEmail(req.Email) {
		return errors.New("invalid email format")
	}
	if len(req.Password) < 6 {
		return errors.New("password must be at least 6 characters")
	}
	if strings.TrimSpace(req.DisplayName) == "" {
		return errors.New("display name is required")
	}
	if len(req.DisplayName) > 20 {
		return errors.New("display name must be 20 characters or less")
	}
	return nil
}

// isValidEmail validates email format
func isValidEmail(email string) bool {
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	return emailRegex.MatchString(email)
}

// EnsureIndexes creates necessary database indexes
func (r *UserRepository) EnsureIndexes(ctx context.Context) error {
	indexModels := []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "email", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys: bson.D{{Key: "username", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "displayName", Value: 1}},
		},
	}

	_, err := r.collection.Indexes().CreateMany(ctx, indexModels)
	if err != nil {
		return fmt.Errorf("failed to create indexes: %w", err)
	}

	return nil
}
