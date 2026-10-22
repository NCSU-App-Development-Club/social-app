package middleware

import (
    "errors"
    "log"

    "social-api/config"

    "github.com/gofiber/fiber/v2"
    "gorm.io/gorm"
)

func AuthMiddleware(c *fiber.Ctx) error {
    authHeader := c.Get("Authorization")
    if authHeader == "" {
        return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Missing Authorization header"})
    }

    tokenUUID := authHeader

    // Query the user by token using GORM
    var dbUser config.DbUser
    err := config.Db.Where("token = ?", tokenUUID).First(&dbUser).Error

    if err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            log.Println("Token not found in user account")
        } else {
            log.Println("Database error while checking token:", err)
        }
        return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid token"})
    }

    // Set the user struct as a local so downstream handlers can access it
    c.Locals("user", dbUser)
    return c.Next()
}