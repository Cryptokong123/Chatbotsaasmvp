# Integration Registry Usage Guide

The Integration Registry System provides a centralized way to manage all integration adapters with metadata, connection status tracking, health monitoring, and lifecycle management.

## Quick Start

```typescript
import { IntegrationRegistry, loadAllIntegrations } from './lib/integrations'

// Load all integrations into the registry
const registry = loadAllIntegrations()

// Create an integration instance for a tenant
const instance = await registry.createInstance(
  'tenant-123', // Tenant ID
  'hubspot',    // Integration type
  {
    type: 'hubspot',
    category: 'crm',
    enabled: true,
    name: 'HubSpot CRM',
    credentials: {
      accessToken: 'your-access-token',
    },
  }
)

console.log('Connected:', instance.status === 'connected')
```

## Core Features

### 1. Registry Initialization

```typescript
import { IntegrationRegistry, loadAllIntegrations } from './lib/integrations'

// Get singleton instance with custom config
const registry = IntegrationRegistry.getInstance({
  enableHealthChecks: true,
  healthCheckInterval: 60000, // 1 minute
  enableMetrics: true,
  metricsInterval: 30000, // 30 seconds
  enableAutoReconnect: true,
  autoReconnectDelay: 5000,
  maxReconnectAttempts: 3,
  enableEventEmission: true,
})

// Load all 32 integrations
loadAllIntegrations(registry)
```

### 2. Querying Integrations

```typescript
// List all registered integrations
const all = registry.listIntegrations()
console.log(`Total integrations: ${all.length}`)

// Get specific integration metadata
const hubspotMeta = registry.getMetadata('hubspot')
console.log('HubSpot capabilities:', hubspotMeta?.capabilities)

// Query by category
const crmIntegrations = registry.getByCategory('crm')
console.log(`CRM integrations: ${crmIntegrations.length}`)

// Advanced querying
const messagingPlatforms = registry.queryIntegrations({
  categories: ['messaging', 'social'],
  capabilities: {
    canSendMessages: true,
    canReceiveMessages: true,
  },
  features: {
    supportsWebhooks: true,
  },
  excludeDeprecated: true,
  sortBy: 'popularity',
  sortOrder: 'desc',
  limit: 10,
})

// Search by name
const results = registry.search('salesforce')

// Find integrations with OAuth support
const oauthIntegrations = registry.queryIntegrations({
  features: {
    supportsOAuth: true,
  },
})

// Find verified integrations
const verified = registry.queryIntegrations({
  isVerified: true,
})
```

### 3. Instance Management

```typescript
// Create and connect an instance
const slackInstance = await registry.createInstance('tenant-123', 'slack', {
  type: 'slack',
  category: 'messaging',
  enabled: true,
  name: 'Slack Workspace',
  credentials: {
    botToken: 'xoxb-your-bot-token',
  },
})

// Get instance by ID
const instance = registry.getInstance(slackInstance.id)

// Get all instances for a tenant
const tenantInstances = registry.getTenantInstances('tenant-123')
console.log(`Tenant has ${tenantInstances.length} integrations`)

// Get tenant's specific integration
const tenantSlack = registry.getTenantInstance('tenant-123', 'slack')

// Get all instances of a specific type
const allSlackInstances = registry.getTypeInstances('slack')

// Disconnect an instance
await registry.disconnectInstance(instance.id)

// Reconnect an instance
await registry.reconnectInstance(instance.id)

// Remove an instance completely
await registry.removeInstance(instance.id)
```

### 4. Health Monitoring

```typescript
// Check health of a specific instance
const health = await registry.healthCheckInstance(instance.id)
console.log('Health:', {
  healthy: health.health.isHealthy,
  latency: health.health.latency,
  consecutiveFailures: health.health.consecutiveFailures,
  circuitBreakerState: health.health.circuitBreakerState,
})

// Check health of all instances
const allHealth = await registry.healthCheckAll()
const unhealthy = allHealth.filter(h => !h.health.isHealthy)
console.log(`Unhealthy integrations: ${unhealthy.length}`)

// Get health summary
const summary = registry.getHealthSummary()
console.log('Health Summary:', {
  total: summary.total,
  healthy: summary.healthy,
  unhealthy: summary.unhealthy,
  disconnected: summary.disconnected,
  error: summary.error,
})

// Get health by integration type
Object.entries(summary.byType).forEach(([type, stats]) => {
  console.log(`${type}: ${stats.healthy}/${stats.total} healthy`)
})
```

### 5. Metrics & Analytics

```typescript
// Get metrics summary
const metrics = registry.getMetricsSummary()
console.log('Metrics:', {
  totalRequests: metrics.totalRequests,
  successRate: metrics.overallSuccessRate.toFixed(2) + '%',
  avgLatency: metrics.averageLatency.toFixed(2) + 'ms',
})

// Get metrics by integration type
Object.entries(metrics.byType).forEach(([type, stats]) => {
  console.log(`${type}:`, {
    requests: stats.requests,
    successRate: stats.successRate.toFixed(2) + '%',
    avgLatency: stats.avgLatency.toFixed(2) + 'ms',
  })
})

// Get overall statistics
const stats = registry.getStats()
console.log('Registry Stats:', {
  registeredIntegrations: stats.registeredIntegrations,
  totalInstances: stats.totalInstances,
  activeInstances: stats.activeInstances,
})
```

### 6. Event Handling

```typescript
// Listen to integration events
registry.on('integration:event', (event) => {
  console.log('Integration event:', event)
})

// Listen to specific event types
registry.on('integration:connection.established', (event) => {
  console.log(`Integration connected: ${event.integration}`)
})

registry.on('integration:connection.lost', (event) => {
  console.log(`Integration disconnected: ${event.integration}`)
})

registry.on('integration:error.occurred', (event) => {
  console.error(`Integration error: ${event.integration}`, event.data.error)
})

// Listen to metrics collection
registry.on('metrics:collected', (metrics) => {
  // Send metrics to monitoring service
  sendToDatadog(metrics)
})

// Listen to registration events
registry.on('integration:registered', (metadata) => {
  console.log(`New integration registered: ${metadata.displayName}`)
})

registry.on('integration:unregistered', (type) => {
  console.log(`Integration unregistered: ${type}`)
})
```

### 7. Export & State Management

```typescript
// Export registry state
const state = registry.exportState()
console.log('Registry State:', {
  config: state.config,
  totalIntegrations: state.registeredIntegrations.length,
  totalInstances: state.instances.length,
})

// Save state to file/database
await saveToDatabase(state)

// Reset registry (useful for testing)
await registry.reset()
```

## Real-World Examples

### Example 1: Multi-Tenant SaaS Platform

```typescript
import { IntegrationRegistry, loadAllIntegrations } from './lib/integrations'

class IntegrationService {
  private registry: IntegrationRegistry

  constructor() {
    this.registry = IntegrationRegistry.getInstance({
      enableHealthChecks: true,
      healthCheckInterval: 60000,
      enableAutoReconnect: true,
      enableEventEmission: true,
    })

    loadAllIntegrations(this.registry)
    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    // Alert on integration failures
    this.registry.on('integration:error.occurred', async (event) => {
      await this.alertAdmin({
        tenant: event.data.tenantId,
        integration: event.integration,
        error: event.data.error,
      })
    })

    // Track metrics
    this.registry.on('metrics:collected', async (metrics) => {
      await this.pushMetrics(metrics)
    })
  }

  async connectIntegration(tenantId: string, integrationType: string, credentials: any) {
    // Check if integration is supported
    if (!this.registry.isRegistered(integrationType)) {
      throw new Error(`Integration ${integrationType} is not supported`)
    }

    // Check if tenant already has this integration
    const existing = this.registry.getTenantInstance(tenantId, integrationType)
    if (existing) {
      throw new Error(`Integration ${integrationType} already connected for this tenant`)
    }

    // Create instance
    const instance = await this.registry.createInstance(tenantId, integrationType, {
      type: integrationType,
      category: this.registry.getMetadata(integrationType)!.category,
      enabled: true,
      name: this.registry.getMetadata(integrationType)!.displayName,
      credentials,
    })

    return {
      id: instance.id,
      type: integrationType,
      status: instance.status,
      connectedAt: instance.connectedAt,
    }
  }

  async disconnectIntegration(tenantId: string, integrationType: string) {
    const instance = this.registry.getTenantInstance(tenantId, integrationType)
    if (!instance) {
      throw new Error(`Integration not found`)
    }

    await this.registry.disconnectInstance(instance.id)
  }

  async getIntegrationsForTenant(tenantId: string) {
    const instances = this.registry.getTenantInstances(tenantId)

    return instances.map(instance => ({
      id: instance.id,
      type: instance.config.type,
      name: instance.config.name,
      status: instance.status,
      health: instance.health,
      metrics: instance.metrics,
      connectedAt: instance.connectedAt,
    }))
  }

  async getAvailableIntegrations(filters?: {
    category?: string
    search?: string
  }) {
    const integrations = this.registry.queryIntegrations({
      category: filters?.category,
      search: filters?.search,
      excludeDeprecated: true,
      sortBy: 'popularity',
      sortOrder: 'desc',
    })

    return integrations.map(meta => ({
      type: meta.type,
      name: meta.displayName,
      description: meta.description,
      category: meta.category,
      iconUrl: meta.iconUrl,
      capabilities: meta.capabilities,
      features: meta.features,
      isVerified: meta.isVerified,
      popularity: meta.popularity,
    }))
  }

  async getHealthDashboard() {
    const summary = this.registry.getHealthSummary()
    const metrics = this.registry.getMetricsSummary()

    return {
      health: {
        total: summary.total,
        healthy: summary.healthy,
        unhealthy: summary.unhealthy,
        healthPercentage: (summary.healthy / summary.total) * 100,
      },
      metrics: {
        totalRequests: metrics.totalRequests,
        successRate: metrics.overallSuccessRate,
        avgLatency: metrics.averageLatency,
      },
      byType: Object.entries(summary.byType).map(([type, stats]) => ({
        type,
        healthy: stats.healthy,
        total: stats.total,
        metrics: metrics.byType[type],
      })),
    }
  }

  private async alertAdmin(alert: any) {
    // Send to monitoring service
    console.error('ALERT:', alert)
  }

  private async pushMetrics(metrics: any) {
    // Push to analytics service
    console.log('METRICS:', metrics)
  }
}

// Usage
const integrationService = new IntegrationService()

// Connect HubSpot for a tenant
await integrationService.connectIntegration('tenant-123', 'hubspot', {
  accessToken: 'your-access-token',
})

// Get tenant's integrations
const integrations = await integrationService.getIntegrationsForTenant('tenant-123')
console.log('Tenant integrations:', integrations)

// Get available integrations
const available = await integrationService.getAvailableIntegrations({
  category: 'crm',
})

// Get health dashboard
const dashboard = await integrationService.getHealthDashboard()
console.log('Health Dashboard:', dashboard)
```

### Example 2: Integration Marketplace

```typescript
import { IntegrationRegistry, loadAllIntegrations } from './lib/integrations'

class IntegrationMarketplace {
  private registry: IntegrationRegistry

  constructor() {
    this.registry = IntegrationRegistry.getInstance()
    loadAllIntegrations(this.registry)
  }

  // Get integrations by category for marketplace UI
  getCategorizedIntegrations() {
    const categories = [
      'messaging',
      'social',
      'crm',
      'support',
      'email',
      'payment',
      'ai',
      'communication',
      'sms',
      'ecommerce',
    ]

    return categories.map(category => ({
      category,
      integrations: this.registry.getByCategory(category).map(meta => ({
        type: meta.type,
        name: meta.displayName,
        description: meta.description,
        iconUrl: meta.iconUrl,
        isVerified: meta.isVerified,
        popularity: meta.popularity,
        tags: meta.tags,
      })),
    }))
  }

  // Get popular integrations
  getPopularIntegrations(limit = 10) {
    return this.registry.queryIntegrations({
      sortBy: 'popularity',
      sortOrder: 'desc',
      limit,
      excludeDeprecated: true,
    })
  }

  // Get integration details
  getIntegrationDetails(type: string) {
    const meta = this.registry.getMetadata(type)
    if (!meta) return null

    return {
      ...meta,
      setupSteps: this.getSetupSteps(type),
      useCases: this.getUseCases(type),
    }
  }

  // Search integrations
  searchIntegrations(query: string) {
    return this.registry.search(query)
  }

  // Get integrations with specific capability
  getIntegrationsByCapability(capability: string) {
    // Example: Find all integrations that can send messages
    return this.registry.queryIntegrations({
      capabilities: {
        canSendMessages: true,
      },
    })
  }

  private getSetupSteps(type: string): string[] {
    // Would fetch from database or config
    return [
      'Create account',
      'Generate API credentials',
      'Configure webhook URL',
      'Test connection',
    ]
  }

  private getUseCases(type: string): string[] {
    // Would fetch from database or config
    return ['Customer support', 'Marketing automation', 'Sales pipeline']
  }
}

// Usage
const marketplace = new IntegrationMarketplace()

// Get integrations by category
const categorized = marketplace.getCategorizedIntegrations()

// Get popular integrations
const popular = marketplace.getPopularIntegrations(10)

// Search
const results = marketplace.searchIntegrations('salesforce')

// Get integration details
const details = marketplace.getIntegrationDetails('hubspot')
```

## Best Practices

1. **Use Singleton Pattern**: Always use `IntegrationRegistry.getInstance()` to ensure single registry instance
2. **Load Once**: Call `loadAllIntegrations()` once at application startup
3. **Handle Events**: Set up event listeners for monitoring and alerting
4. **Health Checks**: Enable automatic health checks for production environments
5. **Error Handling**: Implement proper error handling for instance creation and connection failures
6. **Metrics**: Collect and monitor metrics for performance insights
7. **Multi-tenancy**: Use tenant IDs to isolate integration instances
8. **Auto-reconnect**: Enable auto-reconnect for resilient connections
9. **Resource Cleanup**: Remove instances when tenants disconnect integrations

## API Reference

See `integration-registry.ts` for full API documentation.

## License

Proprietary - All rights reserved
