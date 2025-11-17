/**
 * Integration API - Instance Status
 *
 * GET /api/integrations/:type/status?tenantId=xxx - Get integration instance status
 */

import { NextRequest, NextResponse } from 'next/server'
import { IntegrationRegistry } from '@/lib/integrations/integration-registry'
import { loadAllIntegrations } from '@/lib/integrations/registry-loader'

// Initialize registry
const registry = IntegrationRegistry.getInstance()
loadAllIntegrations(registry)

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    const { type } = params
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const instanceId = searchParams.get('instanceId')

    // Find instance
    let instance
    if (instanceId) {
      instance = registry.getInstance(instanceId)
    } else if (tenantId) {
      instance = registry.getTenantInstance(tenantId, type as any)
    } else {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Either tenantId or instanceId is required',
          },
        },
        { status: 400 }
      )
    }

    if (!instance) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Integration instance not found',
          },
        },
        { status: 404 }
      )
    }

    // Return instance status
    return NextResponse.json({
      success: true,
      data: {
        id: instance.id,
        tenantId: instance.tenantId,
        type: instance.config.type,
        name: instance.config.name,
        status: instance.status,
        health: {
          isHealthy: instance.health.isHealthy,
          lastCheck: instance.health.lastCheck,
          latency: instance.health.latency,
          circuitBreakerState: instance.health.circuitBreakerState,
          consecutiveFailures: instance.health.consecutiveFailures,
          lastError: instance.health.lastError,
        },
        metrics: {
          requestsTotal: instance.metrics.requestsTotal,
          requestsSuccessful: instance.metrics.requestsSuccessful,
          requestsFailed: instance.metrics.requestsFailed,
          averageLatency: Math.round(instance.metrics.averageLatency * 100) / 100,
          successRate: Math.round(instance.metrics.successRate * 100) / 100,
          lastRequest: instance.metrics.lastRequest,
        },
        createdAt: instance.createdAt,
        connectedAt: instance.connectedAt,
        lastActivityAt: instance.lastActivityAt,
      },
    })
  } catch (error: any) {
    console.error('Error getting status:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to get integration status',
        },
      },
      { status: 500 }
    )
  }
}
