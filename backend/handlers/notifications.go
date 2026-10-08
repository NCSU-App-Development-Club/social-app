package handlers

import (
	"fmt"

  	expo "github.com/oliveroneill/exponent-server-sdk-golang/sdk"
)

var Client *expo.PushClient

func InitNotifications() {
	Client = expo.NewPushClient(nil)
}

func SendNotifications(tokens []string, title string, content string) error {
	messages := []expo.PushMessage{}

	for _, token := range tokens {
		pushToken, err := expo.NewExponentPushToken(token)
		if err != nil {
			fmt.Println(err)
			continue
		}

		messages = append(messages, expo.PushMessage{
			To: []expo.ExponentPushToken{pushToken},
			Body: content,
			Title: title,
			Priority: expo.DefaultPriority,
			Sound:    "default",
		})
	}

	_, err := Client.PublishMultiple(messages)
		
	return err
}