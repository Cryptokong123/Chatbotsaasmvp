/**
 * Contact Sync Engine
 *
 * Contact deduplication, merging, and bidirectional sync across platforms
 */

import { createClient } from '@supabase/supabase-js'
import { EventEmitter } from 'events'

// ============================================================================
// TYPES
// ============================================================================

export interface Contact {
  id: string
  instanceId: string
  integrationType: string
  externalId: string
  externalIds: Record<string, string>
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  fullName?: string
  company?: string
  jobTitle?: string
  avatarUrl?: string
  timezone?: string
  locale?: string
  language?: string
  contactType?: 'person' | 'company' | 'lead' | 'bot' | 'unknown'
  socialProfiles?: Record<string, string>
  customFields?: Record<string, any>
  isActive: boolean
  isVerified: boolean
  isDuplicate: boolean
  masterContactId?: string
  tags: string[]
  segments: string[]
  lastSyncedAt?: Date
  lastModifiedAt?: Date
  syncVersion: number
  rawData?: any
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface MergeCandidate {
  contact1: Contact
  contact2: Contact
  confidenceScore: number
  matchingFields: string[]
  suggestedMaster?: string
}

export interface SyncResult {
  success: boolean
  contactId?: string
  action: 'created' | 'updated' | 'merged' | 'skipped' | 'failed'
  error?: string
}

// ============================================================================
// CONTACT SYNC ENGINE
// ============================================================================

export class ContactSyncEngine extends EventEmitter {
  private supabase: ReturnType<typeof createClient>
  private deduplicationThreshold = 0.8 // 80% confidence

  constructor(supabaseUrl: string, supabaseKey: string) {
    super()
    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  // ============================================================================
  // SYNC OPERATIONS
  // ============================================================================

  /**
   * Sync contact from integration platform
   */
  async syncContact(
    instanceId: string,
    integrationType: string,
    contactData: Partial<Contact>
  ): Promise<SyncResult> {
    try {
      // Check if contact already exists
      const existing = await this.findExistingContact(instanceId, contactData.externalId!)

      if (existing) {
        // Update existing contact
        return await this.updateContact(existing.id, contactData)
      } else {
        // Create new contact
        return await this.createContact(instanceId, integrationType, contactData)
      }
    } catch (error: any) {
      return {
        success: false,
        action: 'failed',
        error: error.message,
      }
    }
  }

  /**
   * Create new contact
   */
  private async createContact(
    instanceId: string,
    integrationType: string,
    contactData: Partial<Contact>
  ): Promise<SyncResult> {
    try {
      // Check for duplicates
      const duplicates = await this.findDuplicates(contactData)

      let masterContactId: string | undefined

      if (duplicates.length > 0) {
        // Found potential duplicates
        const bestMatch = duplicates[0]

        if (bestMatch.confidenceScore >= this.deduplicationThreshold) {
          // High confidence match - merge with existing
          masterContactId = bestMatch.contact1.id
          this.emit('contact:duplicate_detected', { contactData, master: bestMatch.contact1 })
        }
      }

      // Insert contact
      const { data, error } = await (this.supabase
        .from('integration_contacts') as any)
        .insert({
          instance_id: instanceId,
          integration_type: integrationType,
          external_id: contactData.externalId,
          external_ids: contactData.externalIds || {},
          email: contactData.email,
          phone: contactData.phone,
          first_name: contactData.firstName,
          last_name: contactData.lastName,
          full_name: contactData.fullName,
          company: contactData.company,
          job_title: contactData.jobTitle,
          avatar_url: contactData.avatarUrl,
          timezone: contactData.timezone,
          locale: contactData.locale,
          language: contactData.language,
          contact_type: contactData.contactType,
          social_profiles: contactData.socialProfiles,
          custom_fields: contactData.customFields,
          is_active: contactData.isActive ?? true,
          is_verified: contactData.isVerified ?? false,
          is_duplicate: !!masterContactId,
          master_contact_id: masterContactId,
          tags: contactData.tags || [],
          segments: contactData.segments || [],
          last_synced_at: new Date().toISOString(),
          last_modified_at: contactData.lastModifiedAt?.toISOString(),
          sync_version: 1,
          raw_data: contactData.rawData,
          metadata: contactData.metadata,
        })
        .select()
        .single()

      if (error) throw error

      this.emit('contact:created', data)

      return {
        success: true,
        contactId: data.id,
        action: 'created',
      }
    } catch (error: any) {
      return {
        success: false,
        action: 'failed',
        error: error.message,
      }
    }
  }

  /**
   * Update existing contact
   */
  private async updateContact(
    contactId: string,
    contactData: Partial<Contact>
  ): Promise<SyncResult> {
    try {
      const { data, error } = await (this.supabase
        .from('integration_contacts') as any)
        .update({
          email: contactData.email,
          phone: contactData.phone,
          first_name: contactData.firstName,
          last_name: contactData.lastName,
          full_name: contactData.fullName,
          company: contactData.company,
          job_title: contactData.jobTitle,
          avatar_url: contactData.avatarUrl,
          timezone: contactData.timezone,
          locale: contactData.locale,
          language: contactData.language,
          contact_type: contactData.contactType,
          social_profiles: contactData.socialProfiles,
          custom_fields: contactData.customFields,
          tags: contactData.tags,
          segments: contactData.segments,
          last_synced_at: new Date().toISOString(),
          last_modified_at: contactData.lastModifiedAt?.toISOString(),
          raw_data: contactData.rawData,
        })
        .eq('id', contactId)
        .select()
        .single()

      if (error) throw error

      this.emit('contact:updated', data)

      return {
        success: true,
        contactId: data.id,
        action: 'updated',
      }
    } catch (error: any) {
      return {
        success: false,
        action: 'failed',
        error: error.message,
      }
    }
  }

  // ============================================================================
  // DEDUPLICATION
  // ============================================================================

  /**
   * Find duplicates for a contact
   */
  async findDuplicates(contactData: Partial<Contact>): Promise<MergeCandidate[]> {
    const candidates: MergeCandidate[] = []

    // Find by email
    if (contactData.email) {
      const { data } = await (this.supabase
        .from('integration_contacts') as any)
        .select('*')
        .eq('email', contactData.email)
        .eq('is_active', true)
        .limit(10)

      if (data) {
        for (const contact of data) {
          const score = this.calculateMatchScore(contactData, contact)
          if (score > 0.5) {
            candidates.push({
              contact1: contact as Contact,
              contact2: contactData as Contact,
              confidenceScore: score,
              matchingFields: this.getMatchingFields(contactData, contact),
            })
          }
        }
      }
    }

    // Find by phone
    if (contactData.phone) {
      const normalizedPhone = this.normalizePhone(contactData.phone)

      const { data } = await (this.supabase
        .from('integration_contacts') as any)
        .select('*')
        .ilike('phone', `%${normalizedPhone}%`)
        .eq('is_active', true)
        .limit(10)

      if (data) {
        for (const contact of data) {
          if (!candidates.find(c => c.contact1.id === contact.id)) {
            const score = this.calculateMatchScore(contactData, contact)
            if (score > 0.5) {
              candidates.push({
                contact1: contact as Contact,
                contact2: contactData as Contact,
                confidenceScore: score,
                matchingFields: this.getMatchingFields(contactData, contact),
              })
            }
          }
        }
      }
    }

    // Find by name + company
    if (contactData.fullName && contactData.company) {
      const { data } = await (this.supabase
        .from('integration_contacts') as any)
        .select('*')
        .ilike('full_name', `%${contactData.fullName}%`)
        .ilike('company', `%${contactData.company}%`)
        .eq('is_active', true)
        .limit(10)

      if (data) {
        for (const contact of data) {
          if (!candidates.find(c => c.contact1.id === contact.id)) {
            const score = this.calculateMatchScore(contactData, contact)
            if (score > 0.5) {
              candidates.push({
                contact1: contact as Contact,
                contact2: contactData as Contact,
                confidenceScore: score,
                matchingFields: this.getMatchingFields(contactData, contact),
              })
            }
          }
        }
      }
    }

    // Sort by confidence score
    candidates.sort((a, b) => b.confidenceScore - a.confidenceScore)

    return candidates
  }

  /**
   * Calculate match score between two contacts
   */
  private calculateMatchScore(contact1: Partial<Contact>, contact2: any): number {
    let score = 0
    let fields = 0

    // Email match (weight: 0.4)
    if (contact1.email && contact2.email) {
      fields++
      if (contact1.email.toLowerCase() === contact2.email.toLowerCase()) {
        score += 0.4
      }
    }

    // Phone match (weight: 0.3)
    if (contact1.phone && contact2.phone) {
      fields++
      const phone1 = this.normalizePhone(contact1.phone)
      const phone2 = this.normalizePhone(contact2.phone)
      if (phone1 === phone2) {
        score += 0.3
      }
    }

    // Name match (weight: 0.2)
    if (contact1.fullName && contact2.full_name) {
      fields++
      const similarity = this.stringSimilarity(
        contact1.fullName.toLowerCase(),
        contact2.full_name.toLowerCase()
      )
      score += similarity * 0.2
    }

    // Company match (weight: 0.1)
    if (contact1.company && contact2.company) {
      fields++
      const similarity = this.stringSimilarity(
        contact1.company.toLowerCase(),
        contact2.company.toLowerCase()
      )
      score += similarity * 0.1
    }

    return fields > 0 ? score : 0
  }

  /**
   * Get matching fields between contacts
   */
  private getMatchingFields(contact1: Partial<Contact>, contact2: any): string[] {
    const matching: string[] = []

    if (contact1.email && contact2.email && contact1.email === contact2.email) {
      matching.push('email')
    }
    if (contact1.phone && contact2.phone && this.normalizePhone(contact1.phone) === this.normalizePhone(contact2.phone)) {
      matching.push('phone')
    }
    if (contact1.fullName && contact2.full_name && contact1.fullName.toLowerCase() === contact2.full_name.toLowerCase()) {
      matching.push('fullName')
    }
    if (contact1.company && contact2.company && contact1.company.toLowerCase() === contact2.company.toLowerCase()) {
      matching.push('company')
    }

    return matching
  }

  /**
   * Merge duplicate contacts
   */
  async mergeContacts(contact1Id: string, contact2Id: string, keepId?: string): Promise<boolean> {
    try {
      const masterId = keepId || contact1Id
      const duplicateId = masterId === contact1Id ? contact2Id : contact1Id

      // Get both contacts
      const { data: contacts } = await (this.supabase
        .from('integration_contacts') as any)
        .select('*')
        .in('id', [masterId, duplicateId])

      if (!contacts || contacts.length !== 2) {
        throw new Error('Contacts not found')
      }

      const master = contacts.find(c => c.id === masterId)!
      const duplicate = contacts.find(c => c.id === duplicateId)!

      // Merge data (master takes precedence, but fill in missing fields)
      const mergedData: any = {
        email: master.email || duplicate.email,
        phone: master.phone || duplicate.phone,
        first_name: master.first_name || duplicate.first_name,
        last_name: master.last_name || duplicate.last_name,
        full_name: master.full_name || duplicate.full_name,
        company: master.company || duplicate.company,
        job_title: master.job_title || duplicate.job_title,
        avatar_url: master.avatar_url || duplicate.avatar_url,
        timezone: master.timezone || duplicate.timezone,
        locale: master.locale || duplicate.locale,
        language: master.language || duplicate.language,
        social_profiles: { ...duplicate.social_profiles, ...master.social_profiles },
        custom_fields: { ...duplicate.custom_fields, ...master.custom_fields },
        tags: Array.from(new Set([...master.tags, ...duplicate.tags])),
        segments: Array.from(new Set([...master.segments, ...duplicate.segments])),
        external_ids: { ...duplicate.external_ids, ...master.external_ids },
      }

      // Update master contact
      await (this.supabase
        .from('integration_contacts') as any)
        .update(mergedData)
        .eq('id', masterId)

      // Mark duplicate as merged
      await (this.supabase
        .from('integration_contacts') as any)
        .update({
          is_duplicate: true,
          master_contact_id: masterId,
          is_active: false,
        })
        .eq('id', duplicateId)

      this.emit('contact:merged', { masterId, duplicateId })

      return true
    } catch (error: any) {
      console.error('Failed to merge contacts:', error)
      return false
    }
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Find existing contact
   */
  private async findExistingContact(instanceId: string, externalId: string): Promise<any> {
    const { data } = await (this.supabase
      .from('integration_contacts') as any)
      .select('*')
      .eq('instance_id', instanceId)
      .eq('external_id', externalId)
      .single()

    return data
  }

  /**
   * Normalize phone number
   */
  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '')
  }

  /**
   * Calculate string similarity (Levenshtein distance)
   */
  private stringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1

    if (longer.length === 0) return 1.0

    const editDistance = this.levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  /**
   * Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = []

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }

    return matrix[str2.length][str1.length]
  }

  /**
   * Bulk sync contacts
   */
  async bulkSync(
    instanceId: string,
    integrationType: string,
    contacts: Partial<Contact>[]
  ): Promise<{ success: number; failed: number; merged: number }> {
    const results = { success: 0, failed: 0, merged: 0 }

    for (const contact of contacts) {
      const result = await this.syncContact(instanceId, integrationType, contact)

      if (result.success) {
        if (result.action === 'merged') {
          results.merged++
        } else {
          results.success++
        }
      } else {
        results.failed++
      }
    }

    this.emit('contact:bulk_sync_completed', results)

    return results
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ContactSyncEngine
