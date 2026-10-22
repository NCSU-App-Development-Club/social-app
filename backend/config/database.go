package config

import (
	"log"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

type User struct {
    Name     string `json:"name"`
    Email    string `json:"email"`
    Provider string `json:"provider"`
    Unique   string `json:"unique"`
    Picture  string `json:"picture"`
}

type DbUser struct {
    gorm.Model
    Uid         string   `json:"uid" gorm:"uniqueIndex"`                    // User unique identifier
    Name        string   `json:"name"`                                     // User name
    Email       string   `json:"email" gorm:"uniqueIndex"`                 // User email
    Provider    string   `json:"provider"`                                 // Authentication provider
    Token       string   `json:"token"`                                    // Session token (UUID)
    Avatar      string   `json:"avatar"`                                   // Avatar URL
    PushToken   string   `json:"push_token"`                               // Optional Expo Push Token
    Bio         string   `json:"bio"`                                      // User bio
    Phone       string   `json:"phone"`                                    // Phone number
    Requests    []string `json:"requests" gorm:"serializer:json"`          // Array of requests
    Connections []string `json:"connections" gorm:"serializer:json"`     // Array of connections
    Majors      []string `json:"majors" gorm:"serializer:json"`          // Array of majors
    Events      []string `json:"events" gorm:"serializer:json"`          // Array of events
}

type Event struct {
    gorm.Model
    EventID     string `json:"id" gorm:"uniqueIndex"`                      // Event ID
    EventType   int    `json:"event_type"`                                 // Event type integer
    Name        string `json:"name"`                                       // Event name
    Description string `json:"description"`                                // Event description
    StartTime   string `json:"start_time"`                                 // ISO start time string
    EndTime     string `json:"end_time"`                                   // Event end time string
    Creator     string `json:"creator"`                                    // Creator user ID
    Location    string `json:"location"`                                   // Location (lat, long)
}

var Db *gorm.DB

func ConnectDB() {
    var err error
    Db, err = gorm.Open(sqlite.Open("social.db"), &gorm.Config{})
    if err != nil {
        log.Fatalf("Failed to connect to database: %v", err)
    }

    // Include BOTH DbUser and Event models so GORM creates the tables automatically
    err = Db.AutoMigrate(&DbUser{}, &Event{})
    if err != nil {
        log.Fatalf("Failed to auto-migrate database: %v", err)
    }

    log.Println("Connected to DB")
}