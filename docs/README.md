# Multi-Platform Integration System

A production-ready integration platform supporting 32+ third-party services including CRM systems, messaging platforms, email providers, and more.

## 🚀 Features

### Core Capabilities

- **32+ Pre-built Integrations**: HubSpot, Salesforce, Zendesk, Intercom, Slack, WhatsApp, Messenger, and more
- **OAuth 2.0 Authentication**: Secure authorization flows with automatic token refresh
- **Webhook Processing**: Real-time event handling with signature verification
- **Bidirectional Sync**: Contact and conversation synchronization across platforms
- **Message Templates**: Dynamic content with variable substitution and filters
- **Intelligent Routing**: Rule-based message routing with load balancing
- **Analytics & Monitoring**: Real-time metrics, health checks, and performance tracking
- **Audit Logging**: Complete activity trails and compliance features

### Technical Infrastructure

#### Security
- AES-256-GCM encryption for credentials
- Row Level Security (RLS) on all database tables
- Webhook signature verification for 10+ platforms
- OAuth state verification
- Idempotency for duplicate prevention

#### Scalability
- Multi-tenant architecture
- Distributed caching with Redis
- Message queue with priority support
- Load balancing (round-robin, least-active, weighted, random)
- Rate limiting (fixed window, sliding window, token bucket)

#### Reliability
- Circuit breaker pattern
- Automatic retries with exponential backoff
- Dead letter queues
- Health monitoring
- Auto-reconnect capability

## 📋 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Integration Platform Core                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Registry System    Message Queue      Webhook Handler       │
│  OAuth Manager      Rate Limiter       Background Jobs       │
│  Contact Sync       Conversation Sync  Data Mapper          │
│  Template Engine    Routing Engine     Cache Manager        │
│  Idempotency       Analytics           Audit Logger         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL via Supabase
- **Caching**: Redis
- **Authentication**: Supabase Auth + OAuth 2.0
- **Language**: TypeScript
- **Testing**: Jest
- **Containerization**: Docker
- **UI**: Radix UI + Tailwind CSS

## 📦 Installation

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or Supabase account)
- Redis 7+ (optional)
- Docker (optional)

### Quick Start

```bash
# Clone repository
git clone <repository-url>
cd Chatbotsaasmvp

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the application.

### Docker Setup

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

## ⚙️ Configuration

### Environment Variables

Create `.env` file with the following:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Security
ENCRYPTION_KEY=your-32-byte-encryption-key

# Redis (Optional)
REDIS_URL=redis://localhost:6379

# OpenAI (For chatbot features)
OPENAI_API_KEY=your-openai-key

# Platform Credentials (Add as needed)
HUBSPOT_CLIENT_ID=your-client-id
HUBSPOT_CLIENT_SECRET=your-client-secret
SLACK_CLIENT_ID=your-client-id
SLACK_CLIENT_SECRET=your-client-secret
# ... add more as needed
```

## 📚 Documentation

- [Integration Guide](./INTEGRATION_GUIDE.md) - Complete setup guide for all 32 platforms
- [API Reference](../lib/integrations/API_DOCUMENTATION.md) - REST API documentation
- [Registry Usage](../lib/integrations/REGISTRY_USAGE.md) - Integration registry guide

## 🏗 Project Structure

```
Chatbotsaasmvp/
├── app/                          # Next.js app directory
│   └── api/integrations/         # API routes
├── components/                   # React components
│   ├── admin/                    # Admin dashboard components
│   └── integrations/             # Integration UI components
├── lib/
│   └── integrations/             # Core integration system
│       ├── adapters/             # 32 integration adapters
│       ├── integration-registry.ts
│       ├── oauth-manager.ts
│       ├── webhook-handler.ts
│       ├── message-queue.ts
│       ├── contact-sync.ts
│       ├── conversation-sync.ts
│       ├── data-mapper.ts
│       ├── cache-manager.ts
│       ├── idempotency.ts
│       ├── template-engine.ts
│       ├── routing-engine.ts
│       ├── audit-logger.ts
│       └── analytics.ts
├── migrations/                   # Database migrations
├── tests/                        # Test suites
├── docs/                         # Documentation
├── docker-compose.yml
└── Dockerfile
```

## 🔌 Supported Integrations

### CRM (8)
- HubSpot
- Salesforce
- Pipedrive
- Zoho CRM

### Messaging (10)
- Slack
- WhatsApp Business
- Facebook Messenger
- Instagram Messaging
- Twitter DM
- Telegram
- Discord
- Microsoft Teams

### Email (4)
- Gmail
- Outlook
- SendGrid
- Mailchimp

### Support (4)
- Zendesk
- Intercom
- Freshdesk
- Drift

### E-commerce (3)
- Shopify
- WooCommerce
- Magento

### Payments (2)
- Stripe
- PayPal

### Productivity (1)
- Calendly

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suite
npm test tests/integrations/registry.test.ts

# Run with coverage
npm run test:coverage
```

## 🚢 Deployment

### Production Build

```bash
# Build application
npm run build

# Start production server
npm start
```

### Docker Deployment

```bash
# Build production image
docker build -t chatbot-integration-platform .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your-url \
  -e ENCRYPTION_KEY=your-key \
  chatbot-integration-platform
```

### Vercel Deployment

The application is optimized for Vercel deployment. Simply connect your repository and Vercel will handle the rest.

## 📊 Monitoring & Analytics

### Built-in Dashboard

Access the admin dashboard at `/admin` to view:
- Real-time integration status
- Message metrics and analytics
- System health monitoring
- Audit logs and activity
- Performance metrics

### Metrics Collected

- Request rates and latencies
- Error rates and types
- Message throughput
- Contact sync statistics
- Integration uptime
- API performance

## 🔒 Security Best Practices

1. **Encryption**: All credentials encrypted at rest
2. **OAuth**: Secure authorization flows with state verification
3. **Webhooks**: Signature verification for all platforms
4. **Rate Limiting**: Prevent abuse and respect platform limits
5. **Audit Logging**: Complete activity trails
6. **Row Level Security**: Database-level access control
7. **Idempotency**: Prevent duplicate operations
8. **HTTPS Only**: Enforce secure connections

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 📄 License

[Your License Here]

## 📞 Support

- Documentation: `/docs`
- Issues: GitHub Issues
- Email: support@example.com

---

**Built with ❤️ for seamless integrations**
