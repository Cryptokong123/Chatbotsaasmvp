/**
 * OAuth 2.0 Flow Manager
 *
 * Handles OAuth authentication flows for all supported integrations
 */

import { IntegrationRegistry } from './integration-registry'
import { CredentialManager } from './credential-manager'

// ============================================================================
// TYPES
// ============================================================================

export interface OAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scopes: string[]
  authorizationUrl: string
  tokenUrl: string
  revokeUrl?: string
  state?: string
  customParams?: Record<string, string>
}

export interface OAuthAuthorizationUrl {
  url: string
  state: string
}

export interface OAuthTokenResponse {
  accessToken: string
  refreshToken?: string
  tokenType: string
  expiresIn: number
  scope?: string[]
  raw?: any
}

export interface OAuthState {
  state: string
  integrationType: string
  tenantId: string
  redirectUri: string
  createdAt: Date
  expiresAt: Date
}

// ============================================================================
// OAUTH MANAGER
// ============================================================================

export class OAuthManager {
  private registry: IntegrationRegistry
  private credentialManager: CredentialManager
  private stateStore: Map<string, OAuthState> = new Map()
  private stateExpiryMs = 10 * 60 * 1000 // 10 minutes

  constructor(registry: IntegrationRegistry, credentialManager: CredentialManager) {
    this.registry = registry
    this.credentialManager = credentialManager

    // Cleanup expired states every minute
    setInterval(() => this.cleanupExpiredStates(), 60000)
  }

  // ============================================================================
  // AUTHORIZATION URL GENERATION
  // ============================================================================

  /**
   * Generate OAuth authorization URL
   */
  generateAuthorizationUrl(
    integrationType: string,
    tenantId: string,
    config: OAuthConfig
  ): OAuthAuthorizationUrl {
    // Generate random state
    const state = this.generateState()

    // Store state for verification
    this.storeState({
      state,
      integrationType,
      tenantId,
      redirectUri: config.redirectUri,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.stateExpiryMs),
    })

    // Build authorization URL
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scopes.join(' '),
      state,
      response_type: 'code',
      ...config.customParams,
    })

    const url = `${config.authorizationUrl}?${params.toString()}`

    return { url, state }
  }

  /**
   * Generate authorization URL for specific integration type
   */
  async generateIntegrationAuthUrl(
    integrationType: string,
    tenantId: string,
    redirectUri: string,
    customScopes?: string[]
  ): Promise<OAuthAuthorizationUrl> {
    const metadata = this.registry.getMetadata(integrationType as any)

    if (!metadata) {
      throw new Error(`Integration ${integrationType} not found`)
    }

    if (!metadata.oauth) {
      throw new Error(`Integration ${integrationType} does not support OAuth`)
    }

    // Get client credentials from environment or config
    const clientId = process.env[`${integrationType.toUpperCase()}_CLIENT_ID`]
    const clientSecret = process.env[`${integrationType.toUpperCase()}_CLIENT_SECRET`]

    if (!clientId || !clientSecret) {
      throw new Error(`OAuth credentials not configured for ${integrationType}`)
    }

    const config: OAuthConfig = {
      clientId,
      clientSecret,
      redirectUri,
      scopes: customScopes || metadata.oauth.defaultScopes || [],
      authorizationUrl: metadata.oauth.authorizationUrl!,
      tokenUrl: metadata.oauth.tokenUrl!,
      revokeUrl: metadata.oauth.revokeUrl,
    }

    return this.generateAuthorizationUrl(integrationType, tenantId, config)
  }

  // ============================================================================
  // TOKEN EXCHANGE
  // ============================================================================

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    code: string,
    state: string
  ): Promise<{
    tokens: OAuthTokenResponse
    integrationType: string
    tenantId: string
  }> {
    // Verify state
    const oauthState = this.verifyState(state)

    if (!oauthState) {
      throw new Error('Invalid or expired state')
    }

    const metadata = this.registry.getMetadata(oauthState.integrationType as any)

    if (!metadata || !metadata.oauth) {
      throw new Error('Invalid integration type')
    }

    // Get client credentials
    const clientId = process.env[`${oauthState.integrationType.toUpperCase()}_CLIENT_ID`]
    const clientSecret = process.env[`${oauthState.integrationType.toUpperCase()}_CLIENT_SECRET`]

    if (!clientId || !clientSecret) {
      throw new Error('OAuth credentials not configured')
    }

    // Exchange code for token
    const tokenResponse = await this.requestToken({
      tokenUrl: metadata.oauth.tokenUrl!,
      clientId,
      clientSecret,
      code,
      redirectUri: oauthState.redirectUri,
      grantType: 'authorization_code',
    })

    // Clean up state
    this.removeState(state)

    return {
      tokens: tokenResponse,
      integrationType: oauthState.integrationType,
      tenantId: oauthState.tenantId,
    }
  }

  /**
   * Request access token from OAuth provider
   */
  private async requestToken(params: {
    tokenUrl: string
    clientId: string
    clientSecret: string
    code?: string
    refreshToken?: string
    redirectUri?: string
    grantType: 'authorization_code' | 'refresh_token'
  }): Promise<OAuthTokenResponse> {
    const body = new URLSearchParams({
      client_id: params.clientId,
      client_secret: params.clientSecret,
      grant_type: params.grantType,
    })

    if (params.code) body.append('code', params.code)
    if (params.refreshToken) body.append('refresh_token', params.refreshToken)
    if (params.redirectUri) body.append('redirect_uri', params.redirectUri)

    try {
      const response = await fetch(params.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: body.toString(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Token request failed: ${response.status} ${errorText}`)
      }

      const data = await response.json()

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        tokenType: data.token_type || 'Bearer',
        expiresIn: data.expires_in || 3600,
        scope: data.scope ? data.scope.split(' ') : undefined,
        raw: data,
      }
    } catch (error: any) {
      throw new Error(`Failed to request token: ${error.message}`)
    }
  }

  // ============================================================================
  // TOKEN REFRESH
  // ============================================================================

  /**
   * Refresh access token
   */
  async refreshAccessToken(
    integrationType: string,
    refreshToken: string
  ): Promise<OAuthTokenResponse> {
    const metadata = this.registry.getMetadata(integrationType as any)

    if (!metadata || !metadata.oauth) {
      throw new Error('Invalid integration type')
    }

    const clientId = process.env[`${integrationType.toUpperCase()}_CLIENT_ID`]
    const clientSecret = process.env[`${integrationType.toUpperCase()}_CLIENT_SECRET`]

    if (!clientId || !clientSecret) {
      throw new Error('OAuth credentials not configured')
    }

    return await this.requestToken({
      tokenUrl: metadata.oauth.tokenUrl!,
      clientId,
      clientSecret,
      refreshToken,
      grantType: 'refresh_token',
    })
  }

  /**
   * Auto-refresh token for an instance if needed
   */
  async autoRefreshToken(instanceId: string, integrationType: string): Promise<boolean> {
    try {
      // Check if token needs refresh
      const needsRefresh = await this.credentialManager.needsTokenRefresh(instanceId)

      if (!needsRefresh) {
        return false
      }

      // Refresh the token
      await this.credentialManager.refreshOAuthToken(instanceId, async (refreshToken) => {
        const newTokens = await this.refreshAccessToken(integrationType, refreshToken)
        return {
          accessToken: newTokens.accessToken,
          refreshToken: newTokens.refreshToken,
          tokenType: newTokens.tokenType,
          expiresIn: newTokens.expiresIn,
          scope: newTokens.scope,
        }
      })

      return true
    } catch (error: any) {
      console.error('Auto-refresh failed:', error)
      return false
    }
  }

  // ============================================================================
  // TOKEN REVOCATION
  // ============================================================================

  /**
   * Revoke OAuth token
   */
  async revokeToken(
    integrationType: string,
    token: string,
    tokenTypeHint: 'access_token' | 'refresh_token' = 'access_token'
  ): Promise<boolean> {
    const metadata = this.registry.getMetadata(integrationType as any)

    if (!metadata || !metadata.oauth || !metadata.oauth.revokeUrl) {
      // If no revoke URL, just return true (some platforms don't support revocation)
      return true
    }

    const clientId = process.env[`${integrationType.toUpperCase()}_CLIENT_ID`]
    const clientSecret = process.env[`${integrationType.toUpperCase()}_CLIENT_SECRET`]

    if (!clientId || !clientSecret) {
      throw new Error('OAuth credentials not configured')
    }

    try {
      const response = await fetch(metadata.oauth.revokeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          token,
          token_type_hint: tokenTypeHint,
        }).toString(),
      })

      return response.ok
    } catch (error: any) {
      console.error('Token revocation failed:', error)
      return false
    }
  }

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  /**
   * Generate random state
   */
  private generateState(): string {
    return Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64url')
  }

  /**
   * Store OAuth state
   */
  private storeState(state: OAuthState): void {
    this.stateStore.set(state.state, state)
  }

  /**
   * Verify and retrieve OAuth state
   */
  private verifyState(state: string): OAuthState | null {
    const oauthState = this.stateStore.get(state)

    if (!oauthState) {
      return null
    }

    // Check if expired
    if (oauthState.expiresAt < new Date()) {
      this.stateStore.delete(state)
      return null
    }

    return oauthState
  }

  /**
   * Remove state
   */
  private removeState(state: string): void {
    this.stateStore.delete(state)
  }

  /**
   * Cleanup expired states
   */
  private cleanupExpiredStates(): void {
    const now = new Date()

    for (const [state, oauthState] of this.stateStore.entries()) {
      if (oauthState.expiresAt < now) {
        this.stateStore.delete(state)
      }
    }
  }

  // ============================================================================
  // PLATFORM-SPECIFIC HELPERS
  // ============================================================================

  /**
   * Handle platform-specific OAuth quirks
   */
  private getPlatformSpecificParams(integrationType: string): Record<string, string> {
    const params: Record<string, string> = {}

    switch (integrationType) {
      case 'hubspot':
        params.grant_type = 'authorization_code'
        break

      case 'salesforce':
        params.prompt = 'consent'
        break

      case 'google':
        params.access_type = 'offline'
        params.prompt = 'consent'
        break

      case 'microsoft':
      case 'teams':
        params.response_mode = 'query'
        break

      case 'shopify':
        // Shopify requires per-shop authorization
        params.grant_options = '[]'
        break

      default:
        break
    }

    return params
  }

  /**
   * Get OAuth scopes for integration type
   */
  getRequiredScopes(integrationType: string): string[] {
    const metadata = this.registry.getMetadata(integrationType as any)

    if (!metadata || !metadata.oauth) {
      return []
    }

    return metadata.oauth.defaultScopes || []
  }

  /**
   * Validate OAuth callback
   */
  validateCallback(params: URLSearchParams): {
    valid: boolean
    error?: string
    code?: string
    state?: string
  } {
    // Check for error
    const error = params.get('error')
    if (error) {
      const errorDescription = params.get('error_description')
      return {
        valid: false,
        error: errorDescription || error,
      }
    }

    // Check for code and state
    const code = params.get('code')
    const state = params.get('state')

    if (!code || !state) {
      return {
        valid: false,
        error: 'Missing code or state parameter',
      }
    }

    return {
      valid: true,
      code,
      state,
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default OAuthManager
