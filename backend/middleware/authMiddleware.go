package middleware

import (
    "context"
    "log"

    "social-api/config"

    "github.com/gofiber/fiber/v2"
    "go.mongodb.org/mongo-driver/bson"
)

func AuthMiddleware(c *fiber.Ctx) error {
    authHeader := c.Get("Authorization")
    if authHeader == "" {
        return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Missing Authorization header"})
    }

    tokenUUID := authHeader

    // Connect to the users collection in MongoDB
    collection := config.GetCollection("users")
    var user bson.M

    // Check if the token UUID exists in any user's document
    filter := bson.M{"token": tokenUUID}
    err := collection.FindOne(context.Background(), filter).Decode(&user)
    if err != nil {
        log.Println("Error finding token in user account:", err)
        return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid token"})
    }

    // Set the entire user account as a local
    c.Locals("user", user)
    return c.Next()
}