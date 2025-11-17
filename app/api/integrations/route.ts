/**
 * Integration API - List and Query Integrations
 *
 * GET /api/integrations - List all available integrations
 * GET /api/integrations?category=crm - Filter by category
 * GET /api/integrations?search=salesforce - Search integrations
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

    // Parse query parameters
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const tags = searchParams.get('tags')?.split(',')
    const isVerified = searchParams.get('verified') === 'true'
    const excludeDeprecated = searchParams.get('exclude_deprecated') !== 'false' // default true
    const sortBy = (searchParams.get('sort_by') as any) || 'popularity'
    const sortOrder = (searchParams.get('sort_order') as any) || 'desc'
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query options
    const queryOptions: any = {
      excludeDeprecated,
      sortBy,
      sortOrder,
      limit,
      offset,
    }

    if (category) queryOptions.category = category
    if (search) queryOptions.search = search
    if (tags) queryOptions.tags = tags
    if (isVerified !== undefined) queryOptions.isVerified = isVerified

    // Query integrations
    const integrations = registry.queryIntegrations(queryOptions)

    // Get total count
    const total = registry.listIntegrations().length

    // Format response
    const formattedIntegrations = integrations.map(meta => ({
      type: meta.type,
      category: meta.category,
      name: meta.name,
      displayName: meta.displayName,
      description: meta.description,
      version: meta.version,
      iconUrl: meta.iconUrl,
      documentationUrl: meta.documentationUrl,
      setupGuideUrl: meta.setupGuideUrl,
      capabilities: meta.capabilities,
      features: meta.features,
      requirements: meta.requirements,
      limits: meta.limits,
      oauth: meta.oauth ? {
        authorizationUrl: meta.oauth.authorizationUrl,
        defaultScopes: meta.oauth.defaultScopes,
        scopesDescription: meta.oauth.scopesDescription,
      } : null,
      webhook: meta.webhook ? {
        supportedEvents: meta.webhook.supportedEvents,
        requiresSignatureVerification: meta.webhook.requiresSignatureVerification,
      } : null,
      tags: meta.tags,
      popularity: meta.popularity,
      isVerified: meta.isVerified,
      isBeta: meta.isBeta,
      isDeprecated: meta.isDeprecated,
    }))

    return NextResponse.json({
      success: true,
      data: formattedIntegrations,
      pagination: {
        total,
        limit,
        offset,
        count: formattedIntegrations.length,
        hasMore: offset + formattedIntegrations.length < total,
      },
    })
  } catch (error: any) {
    console.error('Error listing integrations:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to list integrations',
        },
      },
      { status: 500 }
    )
  }
}
