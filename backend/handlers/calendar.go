package handlers

import (
    "bufio"
    "io"
    "strings"
    "time"

    "social-api/config"

    "github.com/google/uuid"
    "github.com/gofiber/fiber/v2"
)

// Helper to parse ICS timestamp strings (e.g., "20260817T150000" or with TZID) into time.Time
func parseICSDateTime(val string) (time.Time, error) {
    val = strings.TrimSpace(val)
    if t, err := time.Parse("20060102T150402Z", val); err == nil {
        return t, nil
    }
    if t, err := time.Parse("20060102T150402", val); err == nil {
        return t, nil
    }
    if t, err := time.Parse("20060102", val); err == nil {
        return t, nil
    }
    return time.Time{}, fiber.ErrBadRequest
}

// Map ICS BYDAY abbreviation to Go time.Weekday
var dayMap = map[string]time.Weekday{
    "SU": time.Sunday,
    "MO": time.Monday,
    "TU": time.Tuesday,
    "WE": time.Wednesday,
    "TH": time.Thursday,
    "FR": time.Friday,
    "SA": time.Saturday,
}

// UploadICal handles POST /user/calendar/upload
// Parses recurring .ics files and expands them into individual dated event entries
func UploadICal(c *fiber.Ctx) error {
    // Fixed: Added the missing '.' for type assertion on c.Locals("user")
    currentUser, ok := c.Locals("user").(config.DbUser)
    if !ok {
        return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
            "error": "Unauthorized session",
        })
    }

    fileHeader, err := c.FormFile("file")
    if err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
            "error": "No file uploaded or invalid form field name (expected 'file')",
        })
    }

    if !strings.HasSuffix(strings.ToLower(fileHeader.Filename), ".ics") {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
            "error": "Invalid file format: only .ics files are permitted",
        })
    }

    file, err := fileHeader.Open()
    if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": "Failed to open uploaded file",
        })
    }
    defer file.Close()

    fileBytes, err := io.ReadAll(file)
    if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": "Failed to read file contents",
        })
    }

    fileContentStr := string(fileBytes)

    // Google Calendar exports glue END:VEVENT and BEGIN:VEVENT on the same line. 
    // This splits them so the line scanner catches every event block.
    fileContentStr = strings.ReplaceAll(fileContentStr, "END:VEVENTBEGIN:VEVENT", "END:VEVENT\nBEGIN:VEVENT")

    scanner := bufio.NewScanner(strings.NewReader(fileContentStr))
    importedCount := 0

    var inEvent bool
    var currentEvent map[string]string
    var exdates []string

    for scanner.Scan() {
        line := scanner.Text()
        trimmed := strings.TrimSpace(line)

        if strings.HasPrefix(trimmed, "BEGIN:VEVENT") {
            if inEvent && len(currentEvent) > 0 {
                importedCount += expandAndSaveEvent(currentEvent, exdates, currentUser.Uid)
            }
            inEvent = true
            currentEvent = make(map[string]string)
            exdates = []string{}
            continue
        }

        if strings.HasPrefix(trimmed, "END:VEVENT") {
            if inEvent && len(currentEvent) > 0 {
                importedCount += expandAndSaveEvent(currentEvent, exdates, currentUser.Uid)
                inEvent = false
            }
            continue
        }

        if inEvent {
            if strings.HasPrefix(strings.ToUpper(trimmed), "EXDATE") {
                parts := strings.SplitN(trimmed, ":", 2)
                if len(parts) == 2 {
                    rawDates := parts[1]
                    for _, d := range strings.Split(rawDates, ",") {
                        exdates = append(exdates, strings.TrimSpace(d))
                    }
                }
                continue
            }

            parts := strings.SplitN(line, ":", 2)
            if len(parts) == 2 {
                keyPart := parts[0]
                val := parts[1]
                baseKey := strings.Split(keyPart, ";")[0]
                currentEvent[strings.ToUpper(baseKey)] = val
            }
        }
    }

    // Catch trailing event block
    if inEvent && len(currentEvent) > 0 {
        importedCount += expandAndSaveEvent(currentEvent, exdates, currentUser.Uid)
    }

    return c.Status(fiber.StatusOK).JSON(fiber.Map{
        "message":         "Calendar and recurring events successfully imported",
        "events_imported": importedCount,
    })
}

// expandAndSaveEvent calculates all weekly recurring instances based on RRULE and skips EXDATEs
func expandAndSaveEvent(evt map[string]string, exdates []string, userUID string) int {
    baseUID := evt["UID"]
    if baseUID == "" {
        baseUID = uuid.New().String()
    }

    name := evt["SUMMARY"]
    if name == "" {
        name = "Untitled Event"
    }

    description := evt["DESCRIPTION"]
    location := evt["LOCATION"]

    dtStartRaw := evt["DTSTART"]
    dtEndRaw := evt["DTEND"]

    startTime, err1 := parseICSDateTime(dtStartRaw)
    endTime, err2 := parseICSDateTime(dtEndRaw)
    if err1 != nil || err2 != nil {
        return 0
    }

    duration := endTime.Sub(startTime)

    // Build exception date lookup set
    exDateSet := make(map[string]bool)
    for _, exd := range exdates {
        if t, err := parseICSDateTime(exd); err == nil {
            exDateSet[t.Format("20060102")] = true
        } else {
            clean := strings.Split(exd, "T")[0]
            exDateSet[clean] = true
        }
    }

    rrule := evt["RRULE"]
    var untilTime time.Time
    var weekdays []time.Weekday

    if rrule != "" {
        for _, part := range strings.Split(rrule, ";") {
            if strings.HasPrefix(part, "UNTIL=") {
                untilStr := strings.TrimPrefix(part, "UNTIL=")
                if t, err := parseICSDateTime(untilStr); err == nil {
                    untilTime = t
                }
            }
            if strings.HasPrefix(part, "BYDAY=") {
                bydayStr := strings.TrimPrefix(part, "BYDAY=")
                for _, dayCode := range strings.Split(bydayStr, ",") {
                    if wd, exists := dayMap[strings.TrimSpace(dayCode)]; exists {
                        weekdays = append(weekdays, wd)
                    }
                }
            }
        }
    }

    if len(weekdays) == 0 {
        weekdays = []time.Weekday{startTime.Weekday()}
    }
    if untilTime.IsZero() {
        untilTime = startTime.AddDate(0, 4, 0)
    }

    count := 0
    currDate := startTime

    for !currDate.After(untilTime) {
        matchedDay := false
        for _, wd := range weekdays {
            if currDate.Weekday() == wd {
                matchedDay = true
                break
            }
        }

        dateKey := currDate.Format("20060102")

        if matchedDay && !exDateSet[dateKey] {
            instanceStart := time.Date(currDate.Year(), currDate.Month(), currDate.Day(),
                startTime.Hour(), startTime.Minute(), startTime.Second(), 0, startTime.Location())
            instanceEnd := instanceStart.Add(duration)

            instanceID := baseUID + "_" + dateKey

            newEvent := config.Event{
                EventID:     instanceID,
                EventType:   1,
                Name:        name,
                Description: description,
                Location:    location,
                StartTime:   instanceStart.Format(time.RFC3339),
                EndTime:     instanceEnd.Format(time.RFC3339),
                Creator:     userUID,
            }

            var existing config.Event
            if config.Db.Where("event_id = ?", instanceID).First(&existing).Error != nil {
                config.Db.Create(&newEvent)
            } else {
                config.Db.Model(&existing).Updates(map[string]interface{}{
                    "name":        name,
                    "description": description,
                    "location":    location,
                    "start_time":  newEvent.StartTime,
                    "end_time":    newEvent.EndTime,
                })
            }
            count++
        }

        currDate = currDate.AddDate(0, 0, 1)
    }

    return count
}