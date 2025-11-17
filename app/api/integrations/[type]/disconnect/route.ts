/**
 * Integration API - Disconnect Integration
 *
 * POST /api/integrations/:type/disconnect - Disconnect and remove integration instance
 *
 * Request body:
 * {
 *   "tenantId": "tenant-123",
 *   "instanceId": "optional-specific-instance-id"
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { IntegrationRegistry } from '@/lib/integrations/integration-registry'
import { loadAllIntegrations } from '@/lib/integrations/registry-loader'

// Initialize registry
const registry = IntegrationRegistry.getInstance()
loadAllIntegrations(registry)

export async function POST(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    const { type } = params
    const body = await request.json()

    // Validate request
    if (!body.tenantId && !body.instanceId) {
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

    // Find instance
    let instance
    if (body.instanceId) {
      instance = registry.getInstance(body.instanceId)
    } else {
      instance = registry.getTenantInstance(body.tenantId, type as any)
    }

    if (!instance) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Integration instance not found`,
          },
        },
        { status: 404 }
      )
    }

    // Disconnect and remove
    await registry.disconnectInstance(instance.id)
    await registry.removeInstance(instance.id)

    return NextResponse.json({
      success: true,
      data: {
        message: 'Integration disconnected successfully',
        instanceId: instance.id,
        type: instance.config.type,
      },
    })
  } catch (error: any) {
    console.error('Error disconnecting integration:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to disconnect integration',
        },
      },
      { status: 500 }
    )
  }
}
