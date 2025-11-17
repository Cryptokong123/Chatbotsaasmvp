/**
 * Integration API - Metrics
 *
 * GET /api/integrations/metrics - Get metrics for all integrations
 * GET /api/integrations/metrics?tenantId=xxx - Get metrics for specific tenant
 * GET /api/integrations/metrics?type=hubspot - Get metrics for specific integration type
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

    // Get metrics summary
    const summary = registry.getMetricsSummary()

    // Calculate additional metrics
    const response: any = {
      summary: {
        totalRequests: summary.totalRequests,
        successfulRequests: summary.successfulRequests,
        failedRequests: summary.failedRequests,
        averageLatency: Math.round(summary.averageLatency * 100) / 100,
        overallSuccessRate: Math.round(summary.overallSuccessRate * 100) / 100,
      },
      byType: Object.entries(summary.byType).map(([type, stats]) => ({
        type,
        requests: stats.requests,
        successful: stats.successful,
        failed: stats.failed,
        avgLatency: Math.round(stats.avgLatency * 100) / 100,
        successRate: Math.round(stats.successRate * 100) / 100,
      })),
    }

    // Add filtered instance metrics if requested
    if (tenantId || type) {
      let instances: any[] = []

      if (tenantId) {
        instances = registry.getTenantInstances(tenantId)
      } else if (type) {
        instances = registry.getTypeInstances(type as any)
      }

      response.instances = instances.map(inst => ({
        id: inst.id,
        tenantId: inst.tenantId,
        type: inst.config.type,
        name: inst.config.name,
        metrics: {
          requestsTotal: inst.metrics.requestsTotal,
          requestsSuccessful: inst.metrics.requestsSuccessful,
          requestsFailed: inst.metrics.requestsFailed,
          averageLatency: Math.round(inst.metrics.averageLatency * 100) / 100,
          successRate: Math.round(inst.metrics.successRate * 100) / 100,
          lastRequest: inst.metrics.lastRequest,
        },
      }))
    }

    return NextResponse.json({
      success: true,
      data: response,
      timestamp: new Date(),
    })
  } catch (error: any) {
    console.error('Error getting metrics:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to get metrics',
        },
      },
      { status: 500 }
    )
  }
}
