package handlers

import (
	"errors"
	"time"

	"social-api/config"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func GetUserHomeEvents(c *fiber.Ctx) error {
	// 1. Retrieve the user from Fiber locals
	userVal := c.Locals("user")
	user, ok := userVal.(config.DbUser)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized or invalid user session",
		})
	}

	var event config.Event

	// 2. First check for a CURRENT / ONGOING event:
	// start_time <= now AND end_time > now
	nowStr := time.Now().Format("2006-01-02T15:04:05-07:00")

    // 2. Check for a CURRENT / ONGOING event
    err := config.Db.Where("creator = ? AND start_time <= ? AND end_time > ?", user.Uid, nowStr, nowStr).
        Order("start_time ASC").
        First(&event).Error

    if errors.Is(err, gorm.ErrRecordNotFound) {
        // 3. Check for the NEXT UPCOMING event
        err = config.Db.Where("creator = ? AND start_time > ?", user.Uid, nowStr).
            Order("start_time ASC").
            First(&event).Error
    }

	// Handle database query errors
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Return 200 with event set to null (or return custom status as needed)
			return c.Status(fiber.StatusOK).JSON(fiber.Map{
				"name":  user.Name,
				"event": nil,
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch event",
		})
	}

	// 4. Return the user's name and the active/upcoming event
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"name":  user.Name,
		"event": event,
	})
}