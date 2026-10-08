package routes

import (
	_ "social-api/handlers"
	"social-api/middleware"
	"github.com/gofiber/fiber/v2"
)

func SetupUserRoutes(app *fiber.App) {
	userGroup := app.Group("/user", middleware.AuthMiddleware)
	_ = userGroup

}