/**
 * Integration API - Send Message
 *
 * POST /api/integrations/:type/send - Send message through integration
 *
 * Request body:
 * {
 *   "tenantId": "tenant-123",
 *   "recipientId": "user-or-channel-id",
 *   "message": {
 *     "text": "Hello!",
 *     "attachments": [...],
 *     "buttons": [...],
 *     ...
 *   },
 *   "options": {
 *     "metadata": {...},
 *     ...
 *   }
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
    if (!body.tenantId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'tenantId is required',
          },
        },
        { status: 400 }
      )
    }

    if (!body.recipientId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'recipientId is required',
          },
        },
        { status: 400 }
      )
    }

    if (!body.message || !body.message.text) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'message.text is required',
          },
        },
        { status: 400 }
      )
    }

    // Get integration instance
    const instance = registry.getTenantInstance(body.tenantId, type as any)
    if (!instance) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Integration '${type}' not found for this tenant. Please connect it first.`,
          },
        },
        { status: 404 }
      )
    }

    // Check if instance is connected
    if (instance.status !== 'connected') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_CONNECTED',
            message: `Integration is not connected. Current status: ${instance.status}`,
          },
        },
        { status: 400 }
      )
    }

    // Check if adapter supports sending messages
    const metadata = registry.getMetadata(type as any)
    if (!metadata?.capabilities.canSendMessages) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_SUPPORTED',
            message: `Integration '${type}' does not support sending messages`,
          },
        },
        { status: 400 }
      )
    }

    // Send message through adapter
    // Note: This is a generic implementation. Each adapter should have a sendMessage method
    const adapter = instance.adapter as any

    if (typeof adapter.sendMessage !== 'function') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_IMPLEMENTED',
            message: `sendMessage method not implemented for ${type}`,
          },
        },
        { status: 501 }
      )
    }

    const result = await adapter.sendMessage({
      recipientId: body.recipientId,
      text: body.message.text,
      attachments: body.message.attachments,
      buttons: body.message.buttons,
      cards: body.message.cards,
      quickReplies: body.message.quickReplies,
      metadata: body.options?.metadata,
    })

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: result.error?.code || 'SEND_FAILED',
            message: result.error?.message || 'Failed to send message',
            details: result.error?.details,
          },
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        messageId: result.data?.messageId || result.data?.id,
        timestamp: result.metadata?.timestamp || new Date(),
        recipientId: body.recipientId,
        ...result.data,
      },
    })
  } catch (error: any) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to send message',
        },
      },
      { status: 500 }
    )
  }
}
