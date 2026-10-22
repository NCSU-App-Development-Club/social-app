package handlers

import (
    "time"

    "social-api/config"

    "github.com/gofiber/fiber/v2"
)

func GetUserHomeEvents(c *fiber.Ctx) error {
    // 1. Retrieve the user from Fiber locals (populated by AuthMiddleware)
    userVal := c.Locals("user")
    user, ok := userVal.(config.DbUser)
    if !ok {
        return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
            "error": "Unauthorized or invalid user session",
        })
    }

    // 2. Get the target date from query parameters (e.g., ?date=2026-10-22)
    targetDate := c.Query("date")
    if targetDate == "" {
        // Fixed: Go's time layout string must use the reference date 2006-01-02
        targetDate = time.Now().Format("2006-01-02")
    }

    // 3. Initialize as an empty slice (ensures JSON serializes as [] instead of null if 0 events exist)
    events := []config.Event{}

    // Query events for that day where the user is the creator
    err := config.Db.Where("creator = ? AND start_time LIKE ?", user.Uid, targetDate+"%").Find(&events).Error
    if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": "Failed to fetch user events",
        })
    }

    // 4. Return the user's name and events array (empty [] if none found)
    return c.Status(fiber.StatusOK).JSON(fiber.Map{
        "name":   user.Name,
        "date":   targetDate,
        "events": events,
    })
}