/**
 * Integration API - Webhook Receiver
 *
 * POST /api/integrations/:type/webhook - Receive webhooks from integration platforms
 * GET /api/integrations/:type/webhook - Webhook verification (for some platforms)
 */

import { NextRequest, NextResponse } from 'next/server'
import { IntegrationRegistry } from '@/lib/integrations/integration-registry'
import { loadAllIntegrations } from '@/lib/integrations/registry-loader'

// Initialize registry
const registry = IntegrationRegistry.getInstance()
loadAllIntegrations(registry)

// GET handler for webhook verification (e.g., Facebook, Slack)
export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    const { type } = params
    const { searchParams } = new URL(request.url)

    // Facebook/Messenger webhook verification
    if (type === 'messenger' || type === 'instagram') {
      const mode = searchParams.get('hub.mode')
      const token = searchParams.get('hub.verify_token')
      const challenge = searchParams.get('hub.challenge')

      if (mode === 'subscribe' && token) {
        // Verify token (should match the one stored in integration config)
        // For now, return the challenge
        return new NextResponse(challenge || '', { status: 200 })
      }
    }

    // Slack webhook verification
    if (type === 'slack') {
      const challenge = searchParams.get('challenge')
      if (challenge) {
        return NextResponse.json({ challenge })
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'NOT_SUPPORTED',
          message: 'GET webhook verification not supported for this integration type',
        },
      },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Error verifying webhook:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Webhook verification failed',
        },
      },
      { status: 500 }
    )
  }
}

// POST handler for webhook events
export async function POST(
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

    // Check if webhooks are supported
    if (!metadata.features.supportsWebhooks) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_SUPPORTED',
            message: `Integration '${type}' does not support webhooks`,
          },
        },
        { status: 400 }
      )
    }

    // Get request body
    const body = await request.json()

    // Get all instances of this integration type
    const instances = registry.getTypeInstances(type as any)

    if (instances.length === 0) {
      // Log webhook even if no instances
      console.log(`Received webhook for ${type} but no instances configured`)
      return NextResponse.json({ success: true, message: 'Webhook received' })
    }

    // Verify webhook signature if required
    if (metadata.webhook?.requiresSignatureVerification) {
      const signature = request.headers.get(metadata.webhook.signatureHeader || 'x-signature')

      // Verify with each instance until we find a match
      let verified = false
      let verifiedInstance = null

      for (const instance of instances) {
        try {
          const adapter = instance.adapter as any
          if (typeof adapter.verifyWebhook === 'function') {
            const bodyText = JSON.stringify(body)
            const isValid = await adapter.verifyWebhook(
              bodyText,
              signature || '',
              instance.config.webhook?.secret || instance.config.credentials?.webhookSecret
            )

            if (isValid) {
              verified = true
              verifiedInstance = instance
              break
            }
          }
        } catch (error) {
          console.error(`Webhook verification failed for instance ${instance.id}:`, error)
        }
      }

      if (!verified) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_SIGNATURE',
              message: 'Webhook signature verification failed',
            },
          },
          { status: 401 }
        )
      }

      // Parse webhook with the verified instance
      if (verifiedInstance) {
        const adapter = verifiedInstance.adapter as any
        if (typeof adapter.parseWebhook === 'function') {
          const parsed = await adapter.parseWebhook(body)

          // Emit event for webhook
          registry.emit('integration:webhook.received', {
            id: `webhook_${Date.now()}`,
            type: 'webhook.received',
            integration: type,
            timestamp: new Date(),
            data: {
              instanceId: verifiedInstance.id,
              tenantId: verifiedInstance.tenantId,
              event: parsed,
              rawPayload: body,
            },
          })

          return NextResponse.json({
            success: true,
            data: {
              received: true,
              instanceId: verifiedInstance.id,
            },
          })
        }
      }
    }

    // If no signature verification, process with first instance
    // (In production, you'd want better routing logic)
    const firstInstance = instances[0]
    const adapter = firstInstance.adapter as any

    if (typeof adapter.parseWebhook === 'function') {
      const parsed = await adapter.parseWebhook(body)

      // Emit event
      registry.emit('integration:webhook.received', {
        id: `webhook_${Date.now()}`,
        type: 'webhook.received',
        integration: type,
        timestamp: new Date(),
        data: {
          instanceId: firstInstance.id,
          tenantId: firstInstance.tenantId,
          event: parsed,
          rawPayload: body,
        },
      })

      return NextResponse.json({
        success: true,
        data: {
          received: true,
          instanceId: firstInstance.id,
        },
      })
    }

    // Default response if parseWebhook not implemented
    return NextResponse.json({ success: true, message: 'Webhook received' })
  } catch (error: any) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Webhook processing failed',
        },
      },
      { status: 500 }
    )
  }
}
