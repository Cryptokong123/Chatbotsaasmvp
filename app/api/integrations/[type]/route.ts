/**
 * Integration API - Single Integration Details
 *
 * GET /api/integrations/:type - Get integration metadata and instances
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

    // Get integration metadata
    const metadata = registry.getMetadata(type as any)
    if (!metadata) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Integration type '${type}' not found`,
          },
        },
        { status: 404 }
      )
    }

    // Get all instances of this integration type
    const instances = registry.getTypeInstances(type as any)

    // Format instances (hide sensitive data)
    const formattedInstances = instances.map(instance => ({
      id: instance.id,
      tenantId: instance.tenantId,
      status: instance.status,
      health: instance.health,
      metrics: instance.metrics,
      createdAt: instance.createdAt,
      connectedAt: instance.connectedAt,
      lastActivityAt: instance.lastActivityAt,
    }))

    return NextResponse.json({
      success: true,
      data: {
        metadata: {
          type: metadata.type,
          category: metadata.category,
          name: metadata.name,
          displayName: metadata.displayName,
          description: metadata.description,
          version: metadata.version,
          iconUrl: metadata.iconUrl,
          documentationUrl: metadata.documentationUrl,
          setupGuideUrl: metadata.setupGuideUrl,
          capabilities: metadata.capabilities,
          features: metadata.features,
          requirements: metadata.requirements,
          limits: metadata.limits,
          oauth: metadata.oauth,
          webhook: metadata.webhook,
          tags: metadata.tags,
          popularity: metadata.popularity,
          isVerified: metadata.isVerified,
          isBeta: metadata.isBeta,
          isDeprecated: metadata.isDeprecated,
        },
        instances: formattedInstances,
        totalInstances: formattedInstances.length,
        activeInstances: formattedInstances.filter(i => i.status === 'connected').length,
      },
    })
  } catch (error: any) {
    console.error('Error getting integration:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to get integration details',
        },
      },
      { status: 500 }
    )
  }
}
