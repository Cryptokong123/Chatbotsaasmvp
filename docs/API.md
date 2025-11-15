# ChatForge AI - API Reference

Complete API documentation for ChatForge AI.

---

## Base URL

```
Production: https://chatforge.ai/api
Development: http://localhost:3000/api
```

---

## Authentication

Most endpoints require authentication via Supabase Auth. Include the JWT token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## Public Endpoints

### Get Bot Configuration

Get public bot configuration for widget initialization.

```http
GET /api/bots/:botId/config
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Customer Support Bot",
  "primary_color": "#6C47FF",
  "welcome_message": "Hi! How can I help?",
  "placeholder_text": "Type your message...",
  "is_active": true
}
```

### Send Message

Send a message to a bot and get AI response.

```http
POST /api/messages/send
Content-Type: application/json

{
  "botId": "uuid",
  "message": "What are your business hours?",
  "sessionId": "session_xxx"
}
```

**Response:**
```json
{
  "success": true,
  "response": "We're open Monday-Friday, 9 AM - 6 PM EST.",
  "context": [
    {
      "id": "uuid",
      "content": "Business hours: Mon-Fri 9-6 EST",
      "similarity": 0.92,
      "source_name": "FAQ"
    }
  ]
}
```

---

## Protected Endpoints

### Training Data

#### Upload Training Data

```http
POST /api/training/upload
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "botId": "uuid",
  "content": "Your training content here...",
  "sourceType": "text",
  "sourceName": "Product Documentation"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Training data uploaded successfully"
}
```

### Analytics

#### Get Bot Analytics

```http
GET /api/analytics?botId=uuid&days=30
Authorization: Bearer JWT_TOKEN
```

**Response:**
```json
{
  "totalMessages": 1250,
  "totalConversations": 380,
  "avgMessagesPerConversation": 3.3,
  "messagesOverTime": [
    { "date": "2025-01-01", "count": 45 },
    { "date": "2025-01-02", "count": 52 }
  ]
}
```

### Data Export

#### Export All User Data

```http
GET /api/export
Authorization: Bearer JWT_TOKEN
```

**Response:** JSON file download with all user data (GDPR compliance)

### Webhooks

#### List Webhooks

```http
GET /api/webhooks?botId=uuid
Authorization: Bearer JWT_TOKEN
```

#### Create Webhook

```http
POST /api/webhooks
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "botId": "uuid",
  "url": "https://your-server.com/webhook",
  "events": ["message.received", "conversation.started"],
  "secret": "your-webhook-secret"
}
```

#### Delete Webhook

```http
DELETE /api/webhooks?id=uuid
Authorization: Bearer JWT_TOKEN
```

---

## Rate Limits

- **Anonymous requests:** 10 requests/minute per IP
- **Authenticated requests:** 100 requests/hour per user
- **Bot messages:** 1,000 requests/hour per bot

---

## Error Responses

```json
{
  "error": "Error message here",
  "errors": {
    "field": "Validation error message"
  }
}
```

**Status Codes:**
- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `403` - Forbidden (rate limit exceeded)
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

---

## Webhook Events

When you configure webhooks, ChatForge will POST to your URL with this payload:

```json
{
  "event": "message.received",
  "bot_id": "uuid",
  "timestamp": "2025-01-15T10:30:00Z",
  "data": {
    "session_id": "session_xxx",
    "message": "User message content",
    "response": "Bot response"
  }
}
```

**Available Events:**
- `message.received` - New message from user
- `message.sent` - Bot sent response
- `conversation.started` - New conversation initiated

---

## SDKs and Libraries

### JavaScript/TypeScript

```typescript
const chatforge = {
  async sendMessage(botId: string, message: string, sessionId: string) {
    const response = await fetch('https://chatforge.ai/api/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ botId, message, sessionId }),
    })
    return response.json()
  }
}
```

---

## Support

- Documentation: https://docs.chatforge.ai
- API Status: https://status.chatforge.ai
- Support: api@chatforge.ai
