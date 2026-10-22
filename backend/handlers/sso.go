package handlers

import (
    "errors"
    "os"
    "strings"

    "social-api/config"

    "github.com/google/uuid"
    "gorm.io/gorm"
)

func SerializeSSO(data *config.User) (string, error) {
    var dbUser config.DbUser

    // Enforce email domain restriction if DEV is not set to TRUE
    if os.Getenv("DEV") != "TRUE" {
        if !strings.HasSuffix(data.Email, "@ncsu.edu") {
            return "", errors.New("unauthorized email domain: only @ncsu.edu accounts are permitted")
        }
    }

    // 1. Generate a new UUID token upfront
    token, err := uuid.NewRandom()
    if err != nil {
        return "", errors.New("failed to generate UUID")
    }
    newToken := token.String()

    // 2. Query the database for an existing user by Email and Provider
    err = config.Db.Where("email = ? AND provider = ?", data.Email, data.Provider).First(&dbUser).Error

    if errors.Is(err, gorm.ErrRecordNotFound) {
        // Account does not exist, create a new record mapping all whiteboard fields
        newUser := config.DbUser{
            Uid:         data.Unique, // Mapped from incoming User struct
            Name:        data.Name,   // User name
            Email:       data.Email,  // User email[cite: 1]
            Provider:    data.Provider,
            Token:       newToken,    // Session token[cite: 1]
            Avatar:      data.Picture,// Avatar URL[cite: 1]
            PushToken:   "",          // Optional push token default[cite: 1]
            Bio:         "",          // Default empty bio[cite: 1]
            Phone:       "",          // Default empty phone[cite: 1]
            Requests:    []string{},  // Initial empty array[cite: 1]
            Connections: []string{},  // Initial empty array[cite: 1]
            Majors:      []string{},  // Initial empty array[cite: 1]
            Events:      []string{},  // Initial empty array[cite: 1]
        }

        if err := config.Db.Create(&newUser).Error; err != nil {
            return "", errors.New("failed to insert user")
        }

        return newToken, nil
    } else if err != nil {
        return "", err
    }

    // 3. Account exists, update the session token
    updates := map[string]interface{}{
        "token": newToken,
    }

    if err := config.Db.Model(&dbUser).Updates(updates).Error; err != nil {
        return "", err
    }

    return newToken, nil
}