package auth

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"time"
	"social-api/handlers"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

var googleOauthConfig *oauth2.Config

func InitGoogle() {
	callback := os.Getenv("GOOGLE_CALLBACK")

	googleOauthConfig = &oauth2.Config{
		RedirectURL:  callback,
		ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		Scopes: []string{
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
		},
		Endpoint: google.Endpoint,
	}
}

func HandleGoogleLogin(c *fiber.Ctx) error {
	c.ClearCookie("_googlestate")

	state, err := uuid.NewRandom()
	if err != nil {
		return c.JSON(fiber.Map{
			"error": true,
			"trace": "48eeb74e-3880-498d-944f-0929f57482ee",
		})
	}

	url := googleOauthConfig.AuthCodeURL(state.String())

	cookie := &fiber.Cookie{
		Name:     "_googlestate",
		Value:    state.String(),
		HTTPOnly: true,
		Expires:  time.Now().Add(5 * time.Minute),
	}
	c.Cookie(cookie)

	c.Status(fiber.StatusSeeOther)
	c.Redirect(url)
	return nil
}

func HandleGoogleCallback(c *fiber.Ctx) error {
	queryState := c.Query("state")
	cookieState := c.Cookies("_googlestate")

	if queryState != cookieState {
		return c.JSON(fiber.Map{
			"error": true,
			"trace": "159177d5-b73a-49c7-9309-d8c33e7c93b9",
		})
	}

	c.ClearCookie("_googlestate")

	code := c.Query("code")

	token, err := googleOauthConfig.Exchange(context.Background(), code)
	if err != nil {
		return c.JSON(fiber.Map{
			"error": true,
			"trace": "48eeb74e-3880-498d-944f-0929f57482ef",
		})
	}

	resp, err := http.Get("https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + token.AccessToken)
	if err != nil {
		return c.JSON(fiber.Map{
			"error": true,
			"trace": "54e0b45a-0af0-467b-b1c4-012d6c8bc457",
		})
	}

	userData, err := io.ReadAll(resp.Body)
	if err != nil {
		return c.JSON(fiber.Map{
			"error": true,
			"trace": "7cb21b50-0ada-48bc-8768-77d8120b47a2",
		})
	}

	type UserInfo struct {
		VerifiedEmail bool   `json:"verified_email"`
		Name          string `json:"name"`
		Email         string `json:"email"`
		ID            string `json:"id"`
		Picture       string `json:"picture"`
	}

	var userInfo UserInfo
	err = json.Unmarshal(userData, &userInfo)
	if err != nil {
		return c.JSON(fiber.Map{
			"error": true,
			"trace": "9e0c0616-869a-47d3-b6bc-ca80e00cceb0",
		})
	}

	emailVerified := userInfo.VerifiedEmail

	if !emailVerified {
		return c.JSON(fiber.Map{
			"error": true,
			"msg":   "Email not verified",
		})
	}

	user, err := handlers.SerializeSSO(&handlers.User{
		Name:     userInfo.Name,
		Email:    userInfo.Email,
		Provider: "google",
		Unique:   userInfo.ID,
		Picture:  userInfo.Picture,
	})

	if err != nil {
		return c.JSON(fiber.Map{
			"error": true,
			"msg":   "Error while serializing user",
		})
	}

	var protocol string

	if os.Getenv("DEV") == "TRUE" {
		protocol = "exp://"
	} else {
		protocol = "ncsu-social://" // *TODO* Input actual scheme 
	}

	return c.Render("oauthResponse", fiber.Map{
		"Token":    user,
		"Origin":   os.Getenv("FRONTEND_URL"),
		"Protocol": protocol,
	})
}