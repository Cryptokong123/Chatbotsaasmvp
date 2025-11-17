# Integration Platform - Complete Guide

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Platform Setup Guides](#platform-setup-guides)
4. [API Reference](#api-reference)
5. [Architecture](#architecture)
6. [Deployment](#deployment)
7. [Best Practices](#best-practices)

## Overview

This integration platform provides a unified interface to connect and manage 32+ third-party platforms including CRM systems, messaging apps, email providers, and more.

### Key Features

- **32+ Pre-built Integrations**: HubSpot, Salesforce, Slack, WhatsApp, and more
- **OAuth 2.0 Support**: Secure authentication flows
- **Webhook Handling**: Real-time event processing
- **Contact & Conversation Sync**: Bidirectional synchronization
- **Message Templates**: Dynamic content with variable substitution
- **Routing Engine**: Intelligent message routing and assignment
- **Analytics & Monitoring**: Real-time metrics and health checks
- **Rate Limiting**: Respect platform-specific limits
- **Idempotency**: Prevent duplicate operations
- **Audit Logging**: Complete activity trails

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (via Supabase)
- Redis 7+ (optional, for caching)
- Docker (optional)

### Installation

```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Encryption
ENCRYPTION_KEY=your-32-byte-encryption-key

# Redis (optional)
REDIS_URL=redis://localhost:6379

# OpenAI (for chatbot features)
OPENAI_API_KEY=your-openai-key
```

## Platform Setup Guides

### HubSpot Integration

#### 1. Create HubSpot App

1. Go to [HubSpot App Marketplace](https://developers.hubspot.com/)
2. Click "Create App"
3. Fill in app details:
   - **Name**: Your App Name
   - **Description**: App description
   - **Logo**: Upload logo

#### 2. Configure OAuth

1. Go to "Auth" tab
2. Set redirect URL: `https://your-domain.com/api/integrations/hubspot/callback`
3. Select scopes:
   - `contacts`: Read and write contacts
   - `conversations.read`: Read conversations
   - `conversations.write`: Send messages
   - `tickets`: Manage tickets

4. Copy your credentials:
   - Client ID
   - Client Secret

#### 3. Add to Your App

```typescript
// Add credentials to environment
HUBSPOT_CLIENT_ID=your-client-id
HUBSPOT_CLIENT_SECRET=your-client-secret
```

#### 4. Connect Integration

```typescript
// Connect via UI or API
const response = await fetch('/api/integrations/hubspot/connect', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    config: {
      scopes: ['contacts', 'conversations.read', 'conversations.write'],
    },
  }),
})

const { authUrl } = await response.json()
window.location.href = authUrl
```

### Slack Integration

#### 1. Create Slack App

1. Go to [Slack API](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"
3. Name your app and select workspace

#### 2. Add Bot Scopes

1. Go to "OAuth & Permissions"
2. Add Bot Token Scopes:
   - `chat:write`: Send messages
   - `chat:write.public`: Send to public channels
   - `users:read`: Read user info
   - `channels:read`: View channels
   - `im:history`: View DM history
   - `im:read`: View DMs
   - `im:write`: Send DMs

#### 3. Enable Events

1. Go to "Event Subscriptions"
2. Turn on "Enable Events"
3. Request URL: `https://your-domain.com/api/integrations/slack/webhook`
4. Subscribe to bot events:
   - `message.im`: DM messages
   - `message.channels`: Channel messages

#### 4. Install to Workspace

1. Go to "Install App"
2. Click "Install to Workspace"
3. Copy Bot User OAuth Token

### WhatsApp Business Integration

#### 1. Facebook Business Account

1. Create Facebook Business Account
2. Go to [Meta for Developers](https://developers.facebook.com/)
3. Create new app → "Business"

#### 2. Add WhatsApp Product

1. In app dashboard, add "WhatsApp" product
2. Go to "WhatsApp" → "Getting Started"
3. Select phone number or add test number

#### 3. Configure Webhooks

1. Go to "Configuration"
2. Set webhook URL: `https://your-domain.com/api/integrations/whatsapp/webhook`
3. Verify token: Use any secure string
4. Subscribe to fields:
   - `messages`: Incoming messages
   - `message_status`: Message delivery status

#### 4. Get Credentials

1. Copy Phone Number ID
2. Copy Access Token
3. Copy Webhook Verify Token

```env
WHATSAPP_PHONE_NUMBER_ID=your-phone-id
WHATSAPP_ACCESS_TOKEN=your-access-token
WHATSAPP_VERIFY_TOKEN=your-verify-token
```

### Salesforce Integration

#### 1. Create Connected App

1. Go to Salesforce Setup
2. Search "App Manager"
3. Click "New Connected App"

#### 2. Configure OAuth

1. Enable OAuth Settings
2. Callback URL: `https://your-domain.com/api/integrations/salesforce/callback`
3. Selected OAuth Scopes:
   - `Full access (full)`
   - `Perform requests at any time (refresh_token, offline_access)`

#### 3. Get Credentials

1. Copy Consumer Key (Client ID)
2. Copy Consumer Secret (Client Secret)

```env
SALESFORCE_CLIENT_ID=your-consumer-key
SALESFORCE_CLIENT_SECRET=your-consumer-secret
```

## API Reference

### Connect Integration

```http
POST /api/integrations/{type}/connect
Content-Type: application/json

{
  "config": {
    "scopes": ["contacts", "messages"],
    "instanceName": "My Integration"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "authUrl": "https://platform.com/oauth/authorize?..."
  }
}
```

### Send Message

```http
POST /api/integrations/{type}/send
Content-Type: application/json

{
  "instanceId": "uuid",
  "to": "recipient-id",
  "message": {
    "type": "text",
    "text": "Hello, world!"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "messageId": "msg_123",
    "status": "sent",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### List Integrations

```http
GET /api/integrations?category=crm&search=sales
```

**Response:**
```json
{
  "success": true,
  "data": {
    "integrations": [
      {
        "type": "salesforce",
        "displayName": "Salesforce",
        "category": "crm",
        "capabilities": {
          "canSendMessages": true,
          "canSyncContacts": true
        }
      }
    ],
    "pagination": {
      "total": 32,
      "page": 1,
      "limit": 10
    }
  }
}
```

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Integration Platform                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Integration │  │   Message    │  │   Webhook    │      │
│  │   Registry   │  │    Queue     │  │   Handler    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Contact    │  │ Conversation │  │     Data     │      │
│  │     Sync     │  │     Sync     │  │   Mapping    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Template   │  │   Routing    │  │   Analytics  │      │
│  │    Engine    │  │    Engine    │  │  & Logging   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Incoming Webhook** → Signature Verification → Message Queue → Processing → Database
2. **Outgoing Message** → Rate Limiting → Platform API → Delivery Status → Database
3. **Sync Operation** → Data Mapping → Deduplication → Merge/Create → Database

## Deployment

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Environment Configuration

Production checklist:
- ✅ Set strong `ENCRYPTION_KEY` (32 bytes)
- ✅ Use production Supabase project
- ✅ Enable RLS policies
- ✅ Configure Redis for caching
- ✅ Set up monitoring and alerts
- ✅ Configure backup strategy
- ✅ Enable HTTPS
- ✅ Set rate limits

## Best Practices

### Security

1. **Credential Storage**: All credentials are encrypted with AES-256-GCM
2. **OAuth State**: Always verify OAuth state to prevent CSRF
3. **Webhook Signatures**: Verify all webhook signatures
4. **Rate Limiting**: Respect platform rate limits
5. **Audit Logging**: Log all sensitive operations

### Performance

1. **Caching**: Use Redis for frequently accessed data
2. **Message Queue**: Process webhooks asynchronously
3. **Batch Operations**: Group API calls when possible
4. **Connection Pooling**: Reuse database connections
5. **Pagination**: Always paginate large result sets

### Reliability

1. **Retry Logic**: Implement exponential backoff
2. **Circuit Breaker**: Prevent cascading failures
3. **Health Checks**: Monitor integration health
4. **Idempotency**: Use idempotency keys for critical operations
5. **Error Handling**: Graceful degradation

### Monitoring

1. **Metrics**: Track request rates, latencies, errors
2. **Alerts**: Set up alerts for failures and degradation
3. **Logging**: Comprehensive audit trails
4. **Dashboard**: Monitor all integrations in real-time
5. **Analytics**: Track usage and performance trends

## Support

For issues and questions:
- GitHub Issues: [Link to repository]
- Documentation: [Link to docs]
- Email: support@example.com
