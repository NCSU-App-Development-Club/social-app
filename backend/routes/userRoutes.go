package routes

import (
    "social-api/handlers"    // Fixed: Removed the blank identifier '_'
    "social-api/middleware"

    "github.com/gofiber/fiber/v2"
)

func SetupUserRoutes(app *fiber.App) {
    userGroup := app.Group("/user", middleware.AuthMiddleware)

    userGroup.Get("/home", handlers.GetUserHomeEvents)
}