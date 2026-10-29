package handlers

import (
	"errors"

	"social-api/config"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// GetEvent handles GET /events/:eventId
// Returns all stored information for a single event instance.
// Note: recurring events imported via UploadICal are stored as one row per
// occurrence, with IDs shaped like "<baseUID>_<YYYYMMDD>", so pass that full ID.
func GetEvent(c *fiber.Ctx) error {
	// Same session check as UploadICal
	if _, ok := c.Locals("user").(config.DbUser); !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized session",
		})
	}

	eventID := c.Params("eventId")
	if eventID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Missing event ID",
		})
	}

	var event config.Event
	if err := config.Db.Where("event_id = ?", eventID).First(&event).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Event not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch event",
		})
	}

	// Optional: restrict imported (private calendar) events to their owner.
	// currentUser := c.Locals("user").(config.DbUser)
	// if event.EventType == 1 && event.Creator != currentUser.Uid {
	// 	return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Forbidden"})
	// }

	return c.Status(fiber.StatusOK).JSON(event)
}

// Route registration (wherever you set up your protected routes):
//   app.Get("/events/:eventId", GetEvent)