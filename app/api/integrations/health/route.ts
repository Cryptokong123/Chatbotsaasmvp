/**
 * Integration API - Health Check
 *
 * GET /api/integrations/health - Get health status of all integrations
 * GET /api/integrations/health?tenantId=xxx - Get health for specific tenant
 * GET /api/integrations/health?type=hubspot - Get health for specific integration type
 */

import { NextRequest, NextResponse } from 'next/server'
import { IntegrationRegistry } from '@/lib/integrations/integration-registry'
import { loadAllIntegrations } from '@/lib/integrations/registry-loader'

// Initialize registry
const registry = IntegrationRegistry.getInstance()
loadAllIntegrations(registry)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const type = searchParams.get('type')
    const runCheck = searchParams.get('check') === 'true' // Whether to run fresh health checks

    // Run health checks if requested
    if (runCheck) {
      await registry.healthCheckAll()
    }

    // Get health summary
    const summary = registry.getHealthSummary()

    // Filter instances based on query params
    let instances: any[] = []

    if (tenantId) {
      const tenantInstances = registry.getTenantInstances(tenantId)
      instances = tenantInstances.map(inst => ({
        id: inst.id,
        tenantId: inst.tenantId,
        type: inst.config.type,
        name: inst.config.name,
        status: inst.status,
        health: inst.health,
        metrics: inst.metrics,
      }))
    } else if (type) {
      const typeInstances = registry.getTypeInstances(type as any)
      instances = typeInstances.map(inst => ({
        id: inst.id,
        tenantId: inst.tenantId,
        type: inst.config.type,
        name: inst.config.name,
        status: inst.status,
        health: inst.health,
        metrics: inst.metrics,
      }))
    } else {
      // Get all instances
      for (const registration of (registry as any).registeredIntegrations.values()) {
        for (const inst of registration.instances.values()) {
          instances.push({
            id: inst.id,
            tenantId: inst.tenantId,
            type: inst.config.type,
            name: inst.config.name,
            status: inst.status,
            health: inst.health,
            metrics: inst.metrics,
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total: summary.total,
          healthy: summary.healthy,
          unhealthy: summary.unhealthy,
          disconnected: summary.disconnected,
          error: summary.error,
          healthPercentage: summary.total > 0 ? (summary.healthy / summary.total) * 100 : 0,
        },
        byType: Object.entries(summary.byType).map(([type, stats]) => ({
          type,
          total: stats.total,
          healthy: stats.healthy,
          healthPercentage: stats.total > 0 ? (stats.healthy / stats.total) * 100 : 0,
        })),
        instances,
      },
      timestamp: new Date(),
    })
  } catch (error: any) {
    console.error('Error getting health status:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to get health status',
        },
      },
      { status: 500 }
    )
  }
}
