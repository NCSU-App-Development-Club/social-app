package main

import (
	"os"
	"fmt"
	"log"

	"social-api/config"
	"social-api/handlers"
	"social-api/routes"
	"social-api/auth"

	_ "github.com/joho/godotenv/autoload"
	"github.com/gofiber/template/handlebars/v2"
    "github.com/gofiber/fiber/v2"
    "github.com/gofiber/fiber/v2/middleware/cors"
)

func main() {
	fmt.Print("\033[H\033[2J")

	engine := handlebars.New("./views", ".hbs")

	app := fiber.New(fiber.Config{
		Views: engine,
	})

	app.Use(cors.New(cors.Config{
        AllowOrigins: "*",
        AllowHeaders: "Origin, Content-Type, Accept, Query",
    }))

	config.ConnectDB()
    handlers.InitNotifications()
	auth.InitGoogle()

	routes.Setup(app)

	port := os.Getenv("PORT")
    if port == "" {
        port = "8080"
    }

    if err := app.Listen("0.0.0.0:" + port); err != nil {
        log.Fatal(err)
    }
}