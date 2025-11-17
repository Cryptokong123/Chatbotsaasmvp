/**
 * Integration API - Reconnect Integration
 *
 * POST /api/integrations/:type/reconnect - Reconnect a disconnected integration instance
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
            message: 'Integration instance not found',
          },
        },
        { status: 404 }
      )
    }

    // Attempt reconnection
    await registry.reconnectInstance(instance.id)

    // Get updated instance
    const updated = registry.getInstance(instance.id)

    return NextResponse.json({
      success: updated?.status === 'connected',
      data: {
        id: updated!.id,
        tenantId: updated!.tenantId,
        type: updated!.config.type,
        name: updated!.config.name,
        status: updated!.status,
        health: updated!.health,
        message:
          updated!.status === 'connected'
            ? 'Integration reconnected successfully'
            : 'Reconnection attempted but not successful',
      },
    })
  } catch (error: any) {
    console.error('Error reconnecting integration:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to reconnect integration',
        },
      },
      { status: 500 }
    )
  }
}
