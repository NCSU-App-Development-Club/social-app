package handlers

import (
    "errors"

    "social-api/config"

    "github.com/gofiber/fiber/v2"
    "gorm.io/gorm"
)

// GetProfile handles GET /profile/:uid
// Allows authenticated users to view any user's public profile data
func GetProfile(c *fiber.Ctx) error {
    // 1. Ensure the requester is authenticated (middleware ensures this, but verify local)
    _, ok := c.Locals("user").(config.DbUser)
    if !ok {
        return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
            "error": "Unauthorized: You must be logged in to view profiles",
        })
    }

    // 2. Get the target UID from the route parameters
    targetUID := c.Params("uid")
    var profileUser config.DbUser

    // 3. Query the user by their Uid
    err := config.Db.Where("uid = ?", targetUID).First(&profileUser).Error
    if err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
                "error": "User profile not found",
            })
        }
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": "Database error while fetching profile",
        })
    }

    // 4. Return public profile fields (omitting sensitive tokens)[cite: 1]
    return c.Status(fiber.StatusOK).JSON(fiber.Map{
        "uid":         profileUser.Uid,
        "name":        profileUser.Name,
        "avatar":      profileUser.Avatar,
        "bio":         profileUser.Bio,
        "phone":       profileUser.Phone,
        "majors":      profileUser.Majors,
        "connections": profileUser.Connections,
        "events":      profileUser.Events,
    })
}

// UpdateProfileInput defines the allowed fields for profile editing
type UpdateProfileInput struct {
    Name   string   `json:"name"`
    Avatar string   `json:"avatar"`
    Bio    string   `json:"bio"`
    Phone  string   `json:"phone"`
    Majors []string `json:"majors"`
}

// UpdateProfile handles PUT /profile/edit
// Allows an authenticated user to update their own profile info[cite: 1]
func UpdateProfile(c *fiber.Ctx) error {
    // 1. Get the currently logged-in user from Fiber locals
    currentUser, ok := c.Locals("user").(config.DbUser)
    if !ok {
        return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
            "error": "Unauthorized session",
        })
    }

    // 2. Parse incoming JSON request body
    var input UpdateProfileInput
    if err := c.BodyParser(&input); err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
            "error": "Invalid request body",
        })
    }

    // 3. Build updates map dynamically based on provided fields
    updates := map[string]interface{}{}
    if input.Name != "" {
        updates["name"] = input.Name
    }
    if input.Avatar != "" {
        updates["avatar"] = input.Avatar
    }
    if input.Bio != "" {
        updates["bio"] = input.Bio
    }
    if input.Phone != "" {
        updates["phone"] = input.Phone
    }
    if len(input.Majors) > 0 {
        updates["majors"] = input.Majors
    }

    // 4. Update the user record in SQLite using GORM
    err := config.Db.Model(&currentUser).Updates(updates).Error
    if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": "Failed to update profile",
        })
    }

    // Fetch the fresh updated user record to return
    config.Db.First(&currentUser, currentUser.ID)

    return c.Status(fiber.StatusOK).JSON(fiber.Map{
        "message": "Profile updated successfully",
        "user":    currentUser,
    })
}