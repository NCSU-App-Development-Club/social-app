package routes

import (
    "social-api/handlers"
    "social-api/middleware"

    "github.com/gofiber/fiber/v2"
)

func SetupUserRoutes(app *fiber.App) {
    // Group all user routes and protect them with AuthMiddleware
    userGroup := app.Group("/user", middleware.AuthMiddleware)

    // Existing routes
    userGroup.Get("/home", handlers.GetUserHomeEvents)
    userGroup.Get("/event/:eventId", handlers.GetEvent)
    userGroup.Get("/profile/:uid", handlers.GetProfile)
    userGroup.Put("/profile/edit", handlers.UpdateProfile)

    // New iCal upload route: POST /user/calendar/upload
    userGroup.Post("/calendar/upload", handlers.UploadICal)
}