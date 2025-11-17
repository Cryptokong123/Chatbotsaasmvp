/**
 * Credential Management Service
 *
 * Secure credential storage with encryption, OAuth token refresh, and key rotation
 */

import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

// ============================================================================
// TYPES
// ============================================================================

export interface EncryptedCredential {
  id: string
  instanceId: string
  credentialType: 'api_key' | 'api_token' | 'bearer_token' | 'oauth' | 'basic_auth' | 'webhook_secret' | 'jwt' | 'custom'
  encryptedData: Buffer
  encryptionKeyId: string
  accessTokenEncrypted?: Buffer
  refreshTokenEncrypted?: Buffer
  tokenType?: string
  scope?: string[]
  expiresAt?: Date
  isActive: boolean
  lastRotatedAt?: Date
  rotationRequired: boolean
}

export interface DecryptedCredential {
  [key: string]: any
  apiKey?: string
  apiSecret?: string
  apiToken?: string
  accessToken?: string
  refreshToken?: string
  username?: string
  password?: string
  clientId?: string
  clientSecret?: string
  webhookSecret?: string
}

export interface OAuthTokens {
  accessToken: string
  refreshToken?: string
  tokenType: string
  expiresIn: number
  scope?: string[]
}

// ============================================================================
// CREDENTIAL MANAGER
// ============================================================================

export class CredentialManager {
  private supabase: ReturnType<typeof createClient>
  private encryptionKey: Buffer
  private algorithm = 'aes-256-gcm'
  private keyDerivationIterations = 100000

  constructor(supabaseUrl: string, supabaseKey: string, masterKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey)

    // Derive encryption key from master key using PBKDF2
    this.encryptionKey = crypto.pbkdf2Sync(
      masterKey,
      'integration-credentials-salt',
      this.keyDerivationIterations,
      32,
      'sha512'
    )
  }

  // ============================================================================
  // ENCRYPTION / DECRYPTION
  // ============================================================================

  /**
   * Encrypt credentials data
   */
  private encrypt(data: string): { encrypted: Buffer; iv: Buffer; authTag: Buffer } {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv)

    let encrypted = cipher.update(data, 'utf8')
    encrypted = Buffer.concat([encrypted, cipher.final()])

    const authTag = cipher.getAuthTag()

    return { encrypted, iv, authTag }
  }

  /**
   * Decrypt credentials data
   */
  private decrypt(encrypted: Buffer, iv: Buffer, authTag: Buffer): string {
    const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted)
    decrypted = Buffer.concat([decrypted, decipher.final()])

    return decrypted.toString('utf8')
  }

  /**
   * Encrypt and store credentials
   */
  async storeCredentials(
    instanceId: string,
    credentialType: EncryptedCredential['credentialType'],
    credentials: DecryptedCredential
  ): Promise<{ id: string; success: boolean }> {
    try {
      // Encrypt the credentials
      const credentialsJson = JSON.stringify(credentials)
      const { encrypted, iv, authTag } = this.encrypt(credentialsJson)

      // Combine encrypted data with IV and auth tag
      const encryptedData = Buffer.concat([iv, authTag, encrypted])

      // Encrypt OAuth tokens separately if present
      let accessTokenEncrypted: Buffer | undefined
      let refreshTokenEncrypted: Buffer | undefined

      if (credentials.accessToken) {
        const accessEncrypted = this.encrypt(credentials.accessToken)
        accessTokenEncrypted = Buffer.concat([
          accessEncrypted.iv,
          accessEncrypted.authTag,
          accessEncrypted.encrypted,
        ])
      }

      if (credentials.refreshToken) {
        const refreshEncrypted = this.encrypt(credentials.refreshToken)
        refreshTokenEncrypted = Buffer.concat([
          refreshEncrypted.iv,
          refreshEncrypted.authTag,
          refreshEncrypted.encrypted,
        ])
      }

      // Store in database
      const { data, error } = await this.supabase
        .from('integration_credentials')
        .insert({
          instance_id: instanceId,
          credential_type: credentialType,
          encrypted_data: encryptedData,
          encryption_key_id: 'master-key-v1',
          access_token_encrypted: accessTokenEncrypted,
          refresh_token_encrypted: refreshTokenEncrypted,
          token_type: credentials.tokenType,
          scope: credentials.scope,
          expires_at: credentials.expiresAt,
          is_active: true,
          rotation_required: false,
        })
        .select()
        .single()

      if (error) throw error

      return { id: data.id, success: true }
    } catch (error: any) {
      console.error('Failed to store credentials:', error)
      throw new Error(`Failed to store credentials: ${error.message}`)
    }
  }

  /**
   * Retrieve and decrypt credentials
   */
  async getCredentials(instanceId: string, credentialType?: string): Promise<DecryptedCredential | null> {
    try {
      let query = this.supabase
        .from('integration_credentials')
        .select('*')
        .eq('instance_id', instanceId)
        .eq('is_active', true)

      if (credentialType) {
        query = query.eq('credential_type', credentialType)
      }

      const { data, error } = await query.single()

      if (error) {
        if (error.code === 'PGRST116') return null // No rows returned
        throw error
      }

      // Decrypt the main credentials
      const encryptedData = data.encrypted_data
      const iv = encryptedData.slice(0, 16)
      const authTag = encryptedData.slice(16, 32)
      const encrypted = encryptedData.slice(32)

      const decryptedJson = this.decrypt(encrypted, iv, authTag)
      const credentials: DecryptedCredential = JSON.parse(decryptedJson)

      // Decrypt OAuth tokens if present
      if (data.access_token_encrypted) {
        const accessData = data.access_token_encrypted
        const accessIv = accessData.slice(0, 16)
        const accessAuthTag = accessData.slice(16, 32)
        const accessEncrypted = accessData.slice(32)
        credentials.accessToken = this.decrypt(accessEncrypted, accessIv, accessAuthTag)
      }

      if (data.refresh_token_encrypted) {
        const refreshData = data.refresh_token_encrypted
        const refreshIv = refreshData.slice(0, 16)
        const refreshAuthTag = refreshData.slice(16, 32)
        const refreshEncrypted = refreshData.slice(32)
        credentials.refreshToken = this.decrypt(refreshEncrypted, refreshIv, refreshAuthTag)
      }

      // Add token metadata
      if (data.token_type) credentials.tokenType = data.token_type
      if (data.scope) credentials.scope = data.scope
      if (data.expires_at) credentials.expiresAt = new Date(data.expires_at)

      return credentials
    } catch (error: any) {
      console.error('Failed to retrieve credentials:', error)
      throw new Error(`Failed to retrieve credentials: ${error.message}`)
    }
  }

  /**
   * Update credentials
   */
  async updateCredentials(
    instanceId: string,
    credentialType: string,
    credentials: DecryptedCredential
  ): Promise<boolean> {
    try {
      // First, mark existing credentials as inactive
      await this.supabase
        .from('integration_credentials')
        .update({ is_active: false })
        .eq('instance_id', instanceId)
        .eq('credential_type', credentialType)

      // Store new credentials
      await this.storeCredentials(instanceId, credentialType as any, credentials)

      return true
    } catch (error: any) {
      console.error('Failed to update credentials:', error)
      throw new Error(`Failed to update credentials: ${error.message}`)
    }
  }

  /**
   * Delete credentials
   */
  async deleteCredentials(instanceId: string, credentialType?: string): Promise<boolean> {
    try {
      let query = this.supabase
        .from('integration_credentials')
        .delete()
        .eq('instance_id', instanceId)

      if (credentialType) {
        query = query.eq('credential_type', credentialType)
      }

      const { error } = await query

      if (error) throw error

      return true
    } catch (error: any) {
      console.error('Failed to delete credentials:', error)
      throw new Error(`Failed to delete credentials: ${error.message}`)
    }
  }

  // ============================================================================
  // OAUTH TOKEN MANAGEMENT
  // ============================================================================

  /**
   * Check if OAuth token needs refresh
   */
  async needsTokenRefresh(instanceId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('integration_credentials')
        .select('expires_at')
        .eq('instance_id', instanceId)
        .eq('credential_type', 'oauth')
        .eq('is_active', true)
        .single()

      if (error || !data) return false

      if (!data.expires_at) return false

      const expiresAt = new Date(data.expires_at)
      const now = new Date()

      // Refresh if expires in less than 5 minutes
      const fiveMinutes = 5 * 60 * 1000
      return expiresAt.getTime() - now.getTime() < fiveMinutes
    } catch (error) {
      return false
    }
  }

  /**
   * Refresh OAuth token
   */
  async refreshOAuthToken(
    instanceId: string,
    refreshFunction: (refreshToken: string) => Promise<OAuthTokens>
  ): Promise<OAuthTokens | null> {
    try {
      // Get current credentials
      const credentials = await this.getCredentials(instanceId, 'oauth')

      if (!credentials || !credentials.refreshToken) {
        throw new Error('No refresh token available')
      }

      // Call the refresh function (platform-specific)
      const newTokens = await refreshFunction(credentials.refreshToken)

      // Update stored credentials
      await this.updateCredentials(instanceId, 'oauth', {
        ...credentials,
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken || credentials.refreshToken,
        tokenType: newTokens.tokenType,
        scope: newTokens.scope,
        expiresAt: new Date(Date.now() + newTokens.expiresIn * 1000),
      })

      return newTokens
    } catch (error: any) {
      console.error('Failed to refresh OAuth token:', error)
      throw new Error(`Failed to refresh OAuth token: ${error.message}`)
    }
  }

  /**
   * Store OAuth tokens
   */
  async storeOAuthTokens(
    instanceId: string,
    tokens: OAuthTokens,
    additionalData?: Record<string, any>
  ): Promise<{ id: string; success: boolean }> {
    const credentials: DecryptedCredential = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: tokens.tokenType,
      scope: tokens.scope,
      expiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
      ...additionalData,
    }

    return this.storeCredentials(instanceId, 'oauth', credentials)
  }

  // ============================================================================
  // KEY ROTATION
  // ============================================================================

  /**
   * Mark credentials for rotation
   */
  async markForRotation(instanceId: string, credentialType?: string): Promise<boolean> {
    try {
      let query = this.supabase
        .from('integration_credentials')
        .update({ rotation_required: true })
        .eq('instance_id', instanceId)

      if (credentialType) {
        query = query.eq('credential_type', credentialType)
      }

      const { error } = await query

      if (error) throw error

      return true
    } catch (error: any) {
      console.error('Failed to mark for rotation:', error)
      return false
    }
  }

  /**
   * Rotate credentials
   */
  async rotateCredentials(
    instanceId: string,
    credentialType: string,
    newCredentials: DecryptedCredential
  ): Promise<boolean> {
    try {
      // Update credentials
      await this.updateCredentials(instanceId, credentialType, newCredentials)

      // Update rotation timestamp
      await this.supabase
        .from('integration_credentials')
        .update({
          last_rotated_at: new Date().toISOString(),
          rotation_required: false,
        })
        .eq('instance_id', instanceId)
        .eq('credential_type', credentialType)
        .eq('is_active', true)

      return true
    } catch (error: any) {
      console.error('Failed to rotate credentials:', error)
      return false
    }
  }

  /**
   * Get credentials requiring rotation
   */
  async getCredentialsRequiringRotation(): Promise<Array<{
    instanceId: string
    credentialType: string
    lastRotatedAt?: Date
  }>> {
    try {
      const { data, error } = await this.supabase
        .from('integration_credentials')
        .select('instance_id, credential_type, last_rotated_at')
        .eq('rotation_required', true)
        .eq('is_active', true)

      if (error) throw error

      return data.map(row => ({
        instanceId: row.instance_id,
        credentialType: row.credential_type,
        lastRotatedAt: row.last_rotated_at ? new Date(row.last_rotated_at) : undefined,
      }))
    } catch (error: any) {
      console.error('Failed to get credentials requiring rotation:', error)
      return []
    }
  }

  // ============================================================================
  // VALIDATION
  // ============================================================================

  /**
   * Validate credentials format
   */
  validateCredentials(
    credentialType: string,
    credentials: DecryptedCredential
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    switch (credentialType) {
      case 'api_key':
        if (!credentials.apiKey) errors.push('apiKey is required')
        break

      case 'oauth':
        if (!credentials.accessToken) errors.push('accessToken is required')
        if (!credentials.tokenType) errors.push('tokenType is required')
        break

      case 'basic_auth':
        if (!credentials.username) errors.push('username is required')
        if (!credentials.password) errors.push('password is required')
        break

      case 'bearer_token':
        if (!credentials.apiToken && !credentials.accessToken) {
          errors.push('apiToken or accessToken is required')
        }
        break

      default:
        break
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Test credentials by making a test API call
   */
  async testCredentials(
    instanceId: string,
    testFunction: (credentials: DecryptedCredential) => Promise<boolean>
  ): Promise<boolean> {
    try {
      const credentials = await this.getCredentials(instanceId)

      if (!credentials) {
        throw new Error('No credentials found')
      }

      return await testFunction(credentials)
    } catch (error: any) {
      console.error('Credential test failed:', error)
      return false
    }
  }

  /**
   * Get credential metadata (without decrypting)
   */
  async getCredentialMetadata(instanceId: string): Promise<{
    credentialType: string
    expiresAt?: Date
    lastRotatedAt?: Date
    rotationRequired: boolean
  } | null> {
    try {
      const { data, error } = await this.supabase
        .from('integration_credentials')
        .select('credential_type, expires_at, last_rotated_at, rotation_required')
        .eq('instance_id', instanceId)
        .eq('is_active', true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw error
      }

      return {
        credentialType: data.credential_type,
        expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
        lastRotatedAt: data.last_rotated_at ? new Date(data.last_rotated_at) : undefined,
        rotationRequired: data.rotation_required,
      }
    } catch (error: any) {
      console.error('Failed to get credential metadata:', error)
      return null
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default CredentialManager
