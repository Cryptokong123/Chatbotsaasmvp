# Integration API Documentation

Complete REST API documentation for managing integrations.

## Base URL

```
https://your-domain.com/api/integrations
```

## Authentication

All API endpoints require authentication. Include your API key or session token in the request headers:

```
Authorization: Bearer YOUR_API_TOKEN
```

## Endpoints

### 1. List Integrations

Get a list of all available integrations with filtering and search capabilities.

**Endpoint:** `GET /api/integrations`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Filter by category (e.g., 'crm', 'messaging', 'email') |
| `search` | string | Search by name or description |
| `tags` | string | Comma-separated list of tags |
| `verified` | boolean | Filter verified integrations |
| `exclude_deprecated` | boolean | Exclude deprecated integrations (default: true) |
| `sort_by` | string | Sort by: 'name', 'popularity', 'category' (default: 'popularity') |
| `sort_order` | string | Sort order: 'asc' or 'desc' (default: 'desc') |
| `limit` | number | Max results per page (default: 100) |
| `offset` | number | Pagination offset (default: 0) |

**Example Request:**

```bash
GET /api/integrations?category=crm&verified=true&limit=10
```

**Example Response:**

```json
{
  "success": true,
  "data": [
    {
      "type": "hubspot",
      "category": "crm",
      "name": "hubspot",
      "displayName": "HubSpot",
      "description": "All-in-one CRM platform",
      "capabilities": {
        "canSendMessages": true,
        "canReceiveMessages": true,
        "canCreateContacts": true,
        ...
      },
      "features": {
        "supportsWebhooks": true,
        "supportsOAuth": true,
        ...
      },
      "isVerified": true,
      "popularity": 95
    },
    ...
  ],
  "pagination": {
    "total": 32,
    "limit": 10,
    "offset": 0,
    "count": 10,
    "hasMore": true
  }
}
```

### 2. Get Integration Details

Get detailed metadata and instances for a specific integration.

**Endpoint:** `GET /api/integrations/:type`

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Integration type (e.g., 'hubspot', 'salesforce') |

**Example Request:**

```bash
GET /api/integrations/hubspot
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "metadata": {
      "type": "hubspot",
      "displayName": "HubSpot",
      "description": "All-in-one CRM platform",
      "capabilities": { ... },
      "features": { ... },
      "requirements": {
        "requiredCredentials": ["accessToken"],
        "optionalCredentials": []
      },
      "oauth": {
        "authorizationUrl": "https://app.hubspot.com/oauth/authorize",
        "defaultScopes": ["contacts", "tickets"]
      }
    },
    "instances": [
      {
        "id": "tenant-123-hubspot-1234567890",
        "tenantId": "tenant-123",
        "status": "connected",
        "health": { ... },
        "metrics": { ... }
      }
    ],
    "totalInstances": 1,
    "activeInstances": 1
  }
}
```

### 3. Connect Integration

Create and connect a new integration instance for a tenant.

**Endpoint:** `POST /api/integrations/:type/connect`

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Integration type |

**Request Body:**

```json
{
  "tenantId": "tenant-123",
  "credentials": {
    "apiKey": "your-api-key",
    "accessToken": "your-access-token",
    ...
  },
  "config": {
    "enabled": true,
    "name": "My HubSpot Account",
    "webhook": {
      "url": "https://your-domain.com/webhooks/hubspot",
      "secret": "webhook-secret"
    }
  }
}
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": "tenant-123-hubspot-1234567890",
    "tenantId": "tenant-123",
    "type": "hubspot",
    "name": "My HubSpot Account",
    "status": "connected",
    "health": {
      "isHealthy": true,
      "lastCheck": "2025-01-17T12:00:00Z"
    },
    "metrics": {
      "requestsTotal": 0,
      "successRate": 0
    },
    "createdAt": "2025-01-17T12:00:00Z",
    "connectedAt": "2025-01-17T12:00:00Z"
  }
}
```

### 4. Disconnect Integration

Disconnect and remove an integration instance.

**Endpoint:** `POST /api/integrations/:type/disconnect`

**Request Body:**

```json
{
  "tenantId": "tenant-123"
}
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "message": "Integration disconnected successfully",
    "instanceId": "tenant-123-hubspot-1234567890",
    "type": "hubspot"
  }
}
```

### 5. Send Message

Send a message through an integration.

**Endpoint:** `POST /api/integrations/:type/send`

**Request Body:**

```json
{
  "tenantId": "tenant-123",
  "recipientId": "user-or-channel-id",
  "message": {
    "text": "Hello! How can I help you today?",
    "attachments": [
      {
        "type": "image",
        "url": "https://example.com/image.jpg"
      }
    ],
    "buttons": [
      {
        "text": "Get Started",
        "action": "get_started"
      }
    ]
  },
  "options": {
    "metadata": {
      "source": "chatbot",
      "campaign": "onboarding"
    }
  }
}
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "messageId": "msg_abc123",
    "timestamp": "2025-01-17T12:00:00Z",
    "recipientId": "user-or-channel-id"
  }
}
```

### 6. Get Instance Status

Get the current status and health of an integration instance.

**Endpoint:** `GET /api/integrations/:type/status`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `tenantId` | string | Tenant ID (required if instanceId not provided) |
| `instanceId` | string | Instance ID (required if tenantId not provided) |

**Example Request:**

```bash
GET /api/integrations/hubspot/status?tenantId=tenant-123
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": "tenant-123-hubspot-1234567890",
    "tenantId": "tenant-123",
    "type": "hubspot",
    "name": "My HubSpot Account",
    "status": "connected",
    "health": {
      "isHealthy": true,
      "lastCheck": "2025-01-17T12:00:00Z",
      "latency": 145.5,
      "circuitBreakerState": "closed",
      "consecutiveFailures": 0
    },
    "metrics": {
      "requestsTotal": 1250,
      "requestsSuccessful": 1200,
      "requestsFailed": 50,
      "averageLatency": 156.3,
      "successRate": 96.0,
      "lastRequest": "2025-01-17T11:59:00Z"
    },
    "createdAt": "2025-01-15T10:00:00Z",
    "connectedAt": "2025-01-15T10:00:05Z",
    "lastActivityAt": "2025-01-17T11:59:00Z"
  }
}
```

### 7. Reconnect Integration

Attempt to reconnect a disconnected integration instance.

**Endpoint:** `POST /api/integrations/:type/reconnect`

**Request Body:**

```json
{
  "tenantId": "tenant-123"
}
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": "tenant-123-hubspot-1234567890",
    "tenantId": "tenant-123",
    "type": "hubspot",
    "name": "My HubSpot Account",
    "status": "connected",
    "message": "Integration reconnected successfully"
  }
}
```

### 8. Webhook Receiver

Receive webhooks from integration platforms.

**Endpoint:** `POST /api/integrations/:type/webhook`

**Also supports:** `GET /api/integrations/:type/webhook` (for webhook verification)

**Example Webhook Request (from platform):**

```bash
POST /api/integrations/hubspot/webhook
Content-Type: application/json
X-HubSpot-Signature: sha256=...

{
  "subscriptionType": "contact.creation",
  "objectId": 12345,
  "portalId": 62515,
  "occurredAt": 1234567890,
  ...
}
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "received": true,
    "instanceId": "tenant-123-hubspot-1234567890"
  }
}
```

### 9. Health Check

Get health status for all integrations or filter by tenant/type.

**Endpoint:** `GET /api/integrations/health`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `tenantId` | string | Filter by tenant |
| `type` | string | Filter by integration type |
| `check` | boolean | Run fresh health checks (default: false) |

**Example Request:**

```bash
GET /api/integrations/health?check=true
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "summary": {
      "total": 50,
      "healthy": 45,
      "unhealthy": 3,
      "disconnected": 2,
      "error": 0,
      "healthPercentage": 90.0
    },
    "byType": [
      {
        "type": "hubspot",
        "total": 10,
        "healthy": 9,
        "healthPercentage": 90.0
      },
      ...
    ],
    "instances": [...]
  },
  "timestamp": "2025-01-17T12:00:00Z"
}
```

### 10. Metrics

Get metrics for all integrations or filter by tenant/type.

**Endpoint:** `GET /api/integrations/metrics`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `tenantId` | string | Filter by tenant |
| `type` | string | Filter by integration type |

**Example Request:**

```bash
GET /api/integrations/metrics?tenantId=tenant-123
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRequests": 125000,
      "successfulRequests": 120000,
      "failedRequests": 5000,
      "averageLatency": 156.3,
      "overallSuccessRate": 96.0
    },
    "byType": [
      {
        "type": "hubspot",
        "requests": 25000,
        "successful": 24500,
        "failed": 500,
        "avgLatency": 145.2,
        "successRate": 98.0
      },
      ...
    ]
  },
  "timestamp": "2025-01-17T12:00:00Z"
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }
  }
}
```

**Common Error Codes:**

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `AUTH_ERROR` | 401 | Authentication failed |
| `NOT_FOUND` | 404 | Resource not found |
| `ALREADY_EXISTS` | 409 | Resource already exists |
| `NOT_SUPPORTED` | 400 | Feature not supported |
| `NOT_IMPLEMENTED` | 501 | Feature not implemented |
| `RATE_LIMIT` | 429 | Rate limit exceeded |
| `INTERNAL_ERROR` | 500 | Internal server error |

## Rate Limiting

The API implements rate limiting per tenant:

- 100 requests per minute per endpoint
- 1000 requests per hour globally

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

## Webhooks

When integrations send webhooks to your system:

1. Signature verification is performed automatically
2. Events are parsed and emitted through the registry
3. You can listen to webhook events:

```javascript
registry.on('integration:webhook.received', (event) => {
  console.log('Webhook received:', event)
})
```

## Best Practices

1. **Always handle errors**: Check the `success` field in responses
2. **Monitor health**: Use `/health` endpoint for monitoring
3. **Track metrics**: Use `/metrics` endpoint for analytics
4. **Secure webhooks**: Use signature verification
5. **Implement retries**: For failed requests with exponential backoff
6. **Cache responses**: Cache integration metadata to reduce API calls
7. **Use pagination**: When listing large datasets
8. **Filter queries**: Use query parameters to reduce payload size

## Examples

### Complete Integration Flow

```javascript
// 1. List available integrations
const integrations = await fetch('/api/integrations?category=crm')

// 2. Connect HubSpot
const connected = await fetch('/api/integrations/hubspot/connect', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenantId: 'tenant-123',
    credentials: {
      accessToken: 'your-token'
    }
  })
})

// 3. Send a message
const sent = await fetch('/api/integrations/hubspot/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenantId: 'tenant-123',
    recipientId: 'contact-456',
    message: {
      text: 'Hello from our chatbot!'
    }
  })
})

// 4. Check status
const status = await fetch('/api/integrations/hubspot/status?tenantId=tenant-123')

// 5. Get metrics
const metrics = await fetch('/api/integrations/metrics?tenantId=tenant-123')
```

## Support

For API support, contact: support@your-domain.com

## Changelog

### v1.0.0 (2025-01-17)
- Initial API release
- 32 integrations supported
- Full CRUD operations
- Health monitoring
- Metrics tracking
- Webhook support
