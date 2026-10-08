package routes

import (
	"social-api/auth"
	
	"github.com/gofiber/fiber/v2"
)

func SetupAuthRoutes(app *fiber.App) {
	app.Get("/auth/login/google", auth.HandleGoogleLogin)
	app.Get("/auth/callback/google", auth.HandleGoogleCallback)
}