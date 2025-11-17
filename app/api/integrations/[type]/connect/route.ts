/**
 * Integration API - Connect Integration
 *
 * POST /api/integrations/:type/connect - Create and connect an integration instance
 *
 * Request body:
 * {
 *   "tenantId": "tenant-123",
 *   "credentials": {
 *     "apiKey": "...",
 *     "accessToken": "...",
 *     ...
 *   },
 *   "config": {
 *     "enabled": true,
 *     "name": "My HubSpot",
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

    if (!body.credentials) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'credentials are required',
          },
        },
        { status: 400 }
      )
    }

    // Check if integration exists
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

    // Check if tenant already has this integration
    const existing = registry.getTenantInstance(body.tenantId, type as any)
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ALREADY_EXISTS',
            message: `Integration '${type}' is already connected for this tenant`,
            existingInstanceId: existing.id,
          },
        },
        { status: 409 }
      )
    }

    // Validate required credentials
    const missingCredentials = metadata.requirements.requiredCredentials.filter(
      cred => !body.credentials[cred]
    )

    if (missingCredentials.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Missing required credentials: ${missingCredentials.join(', ')}`,
            missingCredentials,
          },
        },
        { status: 400 }
      )
    }

    // Build integration config
    const config = {
      type: type as any,
      category: metadata.category,
      enabled: body.config?.enabled ?? true,
      name: body.config?.name || metadata.displayName,
      description: body.config?.description || metadata.description,
      credentials: body.credentials,
      apiVersion: body.config?.apiVersion,
      baseUrl: body.config?.baseUrl,
      timeout: body.config?.timeout,
      retryAttempts: body.config?.retryAttempts,
      retryDelay: body.config?.retryDelay,
      rateLimit: metadata.limits ? {
        maxRequests: metadata.limits.maxRequestsPerSecond || 10,
        windowMs: 1000,
        strategy: 'sliding' as const,
      } : undefined,
      webhook: body.config?.webhook,
      oauth: body.config?.oauth,
      settings: body.config?.settings,
      metadata: {
        status: 'pending' as const,
      },
    }

    // Create instance
    const instance = await registry.createInstance(body.tenantId, type as any, config)

    // Format response (hide sensitive data)
    return NextResponse.json({
      success: true,
      data: {
        id: instance.id,
        tenantId: instance.tenantId,
        type: instance.config.type,
        name: instance.config.name,
        status: instance.status,
        health: instance.health,
        metrics: instance.metrics,
        createdAt: instance.createdAt,
        connectedAt: instance.connectedAt,
      },
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error connecting integration:', error)

    // Handle specific error types
    if (error.message.includes('Authentication') || error.message.includes('401')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTH_ERROR',
            message: 'Authentication failed. Please check your credentials.',
          },
        },
        { status: 401 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to connect integration',
        },
      },
      { status: 500 }
    )
  }
}
