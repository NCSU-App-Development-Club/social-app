package handlers

import (
	"context"
	"errors"

	"social-api/config"

	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type User struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Provider string `json:"provider"`
	Unique   string `json:"unique"`
	Picture  string `json:"picture"`
}

type DbUser struct {
	Name     string `bson:"name"`
	Email    string `bson:"email"`
	Token    string `bson:"token"`
	Avatar   string `bson:"avatar"`
}

func SerializeSSO(data *User) (string, error) {
	var result bson.M
	err := config.GetCollection("users").FindOne(context.TODO(), bson.D{{Key: "email", Value: data.Email}, {Key: "provider", Value: data.Provider}}).Decode(&result)

	if err == mongo.ErrNoDocuments {
		token, err := uuid.NewRandom()
		if err != nil {
			return "", errors.New("UUID")
		}
		// Account does not exist, create it
		user := DbUser{
			Name:     data.Name,
			Email:    data.Email,
			Token:    token.String(),
			Avatar:   data.Picture,
		}

		// Insert the user object into the MongoDB database
		_, err = config.GetCollection("users").InsertOne(context.TODO(), user)
		if err != nil {
			return "", errors.New("insert")
		}

		return token.String(), nil
	} else {
		token, err := uuid.NewRandom()
		if err != nil {
			return "", errors.New("UUID")
		}

		// Assuming you need to filter by some unique identifier, e.g., user ID, email, etc.
		filter := bson.D{{Key: "_id", Value: result["_id"]}} // Replace with your actual filter, e.g., user ID or email

		update := bson.D{
			{Key: "$set", Value: bson.D{{Key: "token", Value: token.String()}}},
			{Key: "$unset", Value: bson.D{{Key: "pushToken", Value: ""}}}, // `true` is not a valid value for `$unset`, replace it with an empty string.
		}

		_, err = config.GetCollection("users").UpdateOne(context.Background(), filter, update)
		if err != nil {
			return "", err // Handle the update error
		}

		// Account exists, return the updated token
		return token.String(), nil
	}
}