# Facebook Message API

This API endpoint lets you send messages to Facebook users/profiles—**but there are strict limitations set by Facebook.**  
Most users will *not* be able to send a message programmatically (POST); instead you will get a Messenger link to click or share.

---

## Why Doesn’t POST Send a Messenger Message Directly?

- Facebook requires a special ID ("PSID" – Page-Scoped ID) to send a message to a user via their Messenger API.
- You **cannot** send a message to a regular Facebook user or personal profile unless:
  1. You have a Facebook Page, not a personal profile, connected to your app.
  2. The target user has already messaged your Page on Messenger at least once.
  3. You have set up a webhook and captured this user’s PSID.
  4. You have added that PSID to your backend/config so the API can use it.
- Without the user’s PSID, the API falls back and gives you a Messenger link, not a sent message.

---

## How to Get a Facebook User’s PSID: Step-by-Step Guide

**You must follow these steps exactly to get a PSID so you can send messages via API:**

### 1. Create a Facebook Page
- Go to [Facebook Pages](https://www.facebook.com/pages/create/) and make a Page (cannot be personal profile).
- Note your Page ID (from Page settings or Facebook Graph API Explorer).

### 2. Create a Facebook App and Add Messenger Product
- Log into [Facebook Developers](https://developers.facebook.com/).
- Create an app and add the **Messenger** product to it.

### 3. Set Up a Webhook URL
- In your app’s Messenger settings, configure a webhook URL (your backend endpoint) and subscribe to the **messages** event.
- Your webhook URL must be publicly accessible so Facebook can call it.

### 4. Generate a Page Access Token
- In your Facebook app, under Messenger settings, generate a Page Access Token (for your Page).
- Add this token to your server's environment variables as `FACEBOOK_PAGE_ACCESS_TOKEN`.

### 5. Wait for a User to Start a Chat
- Ask the user you want to message to visit your Facebook Page and send a message (any message) on Messenger.

### 6. Capture the PSID From Facebook's Webhook Event
- When the user messages your Page, Facebook will POST a JSON payload to your webhook URL.
- Look for the `sender.id` field in the webhook payload:
  ```json
  {
    "object": "page",
    "entry": [{
      "messaging": [{
        "sender": { "id": "THE_PSID_YOU_NEED" },
        // ...
      }]
    }]
  }
  ```
- Extract the `sender.id` (PSID) from the payload.

### 7. Save the PSID
- Store this PSID in your database, mapped to the user or intended recipient.
- Optionally, define this in your `.env.local` file as:
  ```
  FACEBOOK_PSID_<recipientId>=<the_psid>
  ```

### 8. Now You Can Send Messages Programmatically!
- With the Page Access Token, Page ID, and PSID for your user, POST requests to `/api/facebook/message` will actually send a Messenger message.

---

## API Endpoints

### POST `/api/facebook/message`

Attempts to send a message to a Facebook user:

- **If prerequisites are met and PSID is found**: Sends the message via API.
- **If not**: Returns a Messenger link that must be opened manually.

**Request Body Example:**
```json
{
  "message": "Hello, this is a test message",
  "recipientId": "61583914557523" // Optional, defaults to configured Page/profile ID
}
```

**Example Success Response (message sent via Messenger API):**
```json
{
  "success": true,
  "message": "Message sent successfully via Messenger API",
  "messageId": "mid.1234567890"
}
```

**Example Fallback Response (open Messenger manually):**
```json
{
  "success": true,
  "message": "Messenger link generated (Messenger API not configured or unavailable)",
  "messengerLink": "https://m.me/61583914557523?text=Hello%2C%20this%20is%20a%20test%20message",
  "webMessengerLink": "https://www.facebook.com/messages/t/61583914557523",
  "recipientId": "61583914557523",
  "note": "Use the messengerLink to open Messenger with the pre-filled message. The API cannot send messages to users without their PSID."
}
```

---

### GET `/api/facebook/message`

**Use this to get a Messenger link easily.**

**Parameters:**
- `recipientId` (optional): Facebook profile ID, defaults to the configured profile.
- `message` (optional): Pre-filled message text.

**Example:**
```
GET /api/facebook/message?message=Hello&recipientId=61583914557523
```

**Response:**
```json
{
  "success": true,
  "recipientId": "61583914557523",
  "messengerLink": "https://m.me/61583914557523?text=Hello",
  "webMessengerLink": "https://www.facebook.com/messages/t/61583914557523",
  "profileUrl": "https://www.facebook.com/profile.php?id=61583914557523"
}
```

---

## .env.local Example

```
FACEBOOK_PAGE_ACCESS_TOKEN=your_page_access_token_here
FACEBOOK_PAGE_ID=your_facebook_page_id
FACEBOOK_PSID_61583914557523=the_psid_you_captured_from_webhook
```

---

## Troubleshooting & FAQ

**Q: Why didn’t my POST send a Messenger message?**  
A: You probably do not have the user’s PSID, or you're using a personal profile instead of a Page. Facebook only allows automatic (API) messaging to Page fans who have sent your Page a message and whose PSID you have stored.

**Q: How do I get the PSID for someone?**  
A: Ask them to message your Facebook Page. Capture their PSID from the webhook event (see guide above).

**Q: How do I set up the webhook?**  
A: In your Facebook developer app, under Messenger > Settings, enter a public URL of your backend where you will receive POST requests with Messenger events.

**Q: Can I send messages to private users or profiles I don't control?**  
A: No. You only get a PSID *when the user talks to your Page* and only Pages—not personal profiles—can use the API to send messages.

**Q: How can I test this?**  
A: Set up everything as above, send your Page a message from a test user, check your webhook logs for the PSID, and try sending via the API.

---

## Usage Examples

### (A) Most Users: Just Get a Messenger Link

```typescript
const response = await fetch('/api/facebook/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Your order has been confirmed!' }),
});
const data = await response.json();
console.log(data.messengerLink); // open this link to send the message
```

### (B) If You Have a PSID and Page Setup (Programmatic Send)

If you’ve followed the steps above and the recipient’s PSID is known, POST will send the Messenger message directly.

---

## Summary

> **You must collect each user's PSID** (via webhook after they message your Page) in order to send them API messages. If not, you’ll get a Messenger link to open manually.  
> See Facebook’s [official guide](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messages/) to learn more.

---

