/**
 * Integration Registry Tests
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { IntegrationRegistry } from '@/lib/integrations/integration-registry'

describe('IntegrationRegistry', () => {
  let registry: IntegrationRegistry

  beforeEach(() => {
    registry = IntegrationRegistry.getInstance()
  })

  afterEach(async () => {
    // Cleanup
    await registry.cleanup()
  })

  describe('Registration', () => {
    it('should register an integration adapter', () => {
      const mockAdapter = {
        type: 'test-platform' as any,
        connect: jest.fn(),
        disconnect: jest.fn(),
        sendMessage: jest.fn(),
        healthCheck: jest.fn(),
      }

      registry.register('test-platform' as any, mockAdapter, {
        displayName: 'Test Platform',
        description: 'Test integration',
        category: 'messaging',
        capabilities: {
          canSendMessages: true,
          canReceiveMessages: false,
          supportsWebhooks: false,
          supportsOAuth: true,
          canSyncContacts: false,
          canSyncConversations: false,
        },
      })

      const registered = registry.get('test-platform' as any)
      expect(registered).toBeDefined()
      expect(registered?.metadata.displayName).toBe('Test Platform')
    })

    it('should list all registered integrations', () => {
      const integrations = registry.listAll()
      expect(Array.isArray(integrations)).toBe(true)
      expect(integrations.length).toBeGreaterThan(0)
    })

    it('should query integrations by category', () => {
      const crmIntegrations = registry.query({ category: 'crm' })
      expect(Array.isArray(crmIntegrations)).toBe(true)
      crmIntegrations.forEach((integration) => {
        expect(integration.metadata.category).toBe('crm')
      })
    })
  })

  describe('Instance Management', () => {
    it('should create an integration instance', async () => {
      const instance = await registry.createInstance('test-tenant', 'hubspot', {
        credentials: {
          apiKey: 'test-api-key',
        },
      })

      expect(instance).toBeDefined()
      expect(instance.id).toBeDefined()
      expect(instance.tenantId).toBe('test-tenant')
      expect(instance.integrationType).toBe('hubspot')
    })

    it('should get instance by ID', async () => {
      const created = await registry.createInstance('test-tenant', 'hubspot', {
        credentials: { apiKey: 'test' },
      })

      const instance = await registry.getInstance(created.id)
      expect(instance).toBeDefined()
      expect(instance?.id).toBe(created.id)
    })

    it('should disconnect an instance', async () => {
      const instance = await registry.createInstance('test-tenant', 'hubspot', {
        credentials: { apiKey: 'test' },
      })

      await registry.disconnectInstance(instance.id)

      const disconnected = await registry.getInstance(instance.id)
      expect(disconnected?.status).toBe('disconnected')
    })
  })

  describe('Health Checks', () => {
    it('should perform health check on instance', async () => {
      const instance = await registry.createInstance('test-tenant', 'hubspot', {
        credentials: { apiKey: 'test' },
      })

      const health = await registry.healthCheck(instance.id)
      expect(health).toBeDefined()
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status)
    })

    it('should perform health check on all instances', async () => {
      await registry.createInstance('test-tenant', 'hubspot', {
        credentials: { apiKey: 'test' },
      })

      const results = await registry.healthCheckAll()
      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBeGreaterThan(0)
    })
  })

  describe('Metrics', () => {
    it('should get metrics for instance', async () => {
      const instance = await registry.createInstance('test-tenant', 'hubspot', {
        credentials: { apiKey: 'test' },
      })

      const metrics = registry.getMetrics(instance.id)
      expect(metrics).toBeDefined()
      expect(metrics.totalMessages).toBeDefined()
      expect(metrics.totalErrors).toBeDefined()
    })

    it('should get metrics summary', () => {
      const summary = registry.getMetricsSummary()
      expect(summary).toBeDefined()
      expect(summary.totalInstances).toBeDefined()
      expect(summary.totalMessages).toBeDefined()
    })
  })
})
