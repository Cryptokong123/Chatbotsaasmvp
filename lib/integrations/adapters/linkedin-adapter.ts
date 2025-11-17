/**
 * LinkedIn Adapter - Comprehensive LinkedIn API v2 integration
 * Supports profiles, posts, companies, messaging, connections, analytics, and lead gen
 */
import { BaseIntegrationAdapter } from '../base-adapter'
import { IntegrationConfig, IntegrationCapabilities, IntegrationResponse } from '../types'

// Profile interfaces
export interface LinkedInProfile {
  id: string
  firstName?: { localized: { [locale: string]: string } }
  lastName?: { localized: { [locale: string]: string } }
  headline?: { localized: { [locale: string]: string } }
  vanityName?: string
  profilePicture?: {
    displayImage: string
    'displayImage~'?: {
      elements: Array<{
        identifiers: Array<{ identifier: string }>
        data: {
          'com.linkedin.digitalmedia.mediaartifact.StillImage': {
            displaySize: { width: number; height: number }
          }
        }
      }>
    }
  }
}

// Post/UGC interfaces
export interface LinkedInUGCPost {
  author: string // urn:li:person:{id} or urn:li:organization:{id}
  lifecycleState?: 'PUBLISHED' | 'DRAFT'
  specificContent: {
    'com.linkedin.ugc.ShareContent': {
      shareCommentary: {
        text: string
        attributes?: Array<{
          start: number
          length: number
          value: {
            'com.linkedin.common.CompanyAttributedEntity'?: { company: string }
            'com.linkedin.common.MemberAttributedEntity'?: { member: string }
          }
        }>
      }
      shareMediaCategory: 'NONE' | 'IMAGE' | 'VIDEO' | 'ARTICLE'
      media?: Array<{
        status: 'READY'
        description?: { text: string }
        media: string // URN
        title?: { text: string }
        originalUrl?: string
        thumbnails?: string[]
      }>
    }
  }
  visibility: {
    'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' | 'CONNECTIONS'
  }
  targetAudience?: {
    targetedEntities?: Array<{
      locations?: string[]
      industries?: string[]
      seniorities?: string[]
      staffCountRanges?: string[]
    }>
  }
}

export interface LinkedInPost {
  id: string
  author: string
  created: { time: number }
  lastModified: { time: number }
  lifecycleState: string
  visibility: any
  specificContent: any
  commentary?: string
  reshareContext?: { parent: string }
}

// Share statistics
export interface LinkedInShareStatistics {
  totalShareStatistics: {
    shareCount: number
    likeCount: number
    commentCount: number
    engagement: number
    clickCount: number
    impressionCount: number
    uniqueImpressionsCount: number
  }
}

// Organization interfaces
export interface LinkedInOrganization {
  id: number
  name: { localized: { [locale: string]: string } }
  vanityName: string
  localizedName?: string
  localizedWebsite?: string
  logoV2?: {
    original: string
    cropped: string
    cropInfo?: { x: number; y: number; width: number; height: number }
  }
  locations?: string[]
  description?: { localized: { [locale: string]: string } }
  staffCount?: number
  staffCountRange?: string
  industries?: string[]
  specialities?: string[]
  founded?: { year: number }
}

export interface LinkedInOrganizationFollowerStatistics {
  followerCounts: {
    organicFollowerCount: number
    paidFollowerCount: number
  }
  followerCountsByFunction?: Array<{
    function: string
    followerCounts: {
      organicFollowerCount: number
      paidFollowerCount: number
    }
  }>
  followerCountsBySeniority?: Array<{
    seniority: string
    followerCounts: {
      organicFollowerCount: number
      paidFollowerCount: number
    }
  }>
}

// Messaging interfaces
export interface LinkedInConversation {
  conversationId: string
  participants: Array<{ participant: string }>
  lastActivityAt: number
  read: boolean
}

export interface LinkedInMessage {
  messageId: string
  conversationId: string
  from: string
  created: number
  body: {
    text: string
    attributes?: any[]
  }
  attachments?: Array<{
    id: string
    byteSize: number
    mediaType: string
    name: string
    reference: string
  }>
}

// Media upload interfaces
export interface LinkedInMediaUpload {
  value: {
    uploadMechanism: {
      'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest': {
        uploadUrl: string
        headers: { [key: string]: string }
      }
    }
    asset: string
    mediaArtifact: string
  }
}

export interface LinkedInRegisterUploadRequest {
  registerUploadRequest: {
    recipes: string[]
    owner: string
    serviceRelationships: Array<{
      relationshipType: 'OWNER'
      identifier: 'urn:li:userGeneratedContent'
    }>
  }
}

// Connection interfaces
export interface LinkedInConnection {
  id: string
  firstName: { localized: { [locale: string]: string } }
  lastName: { localized: { [locale: string]: string } }
  headline?: { localized: { [locale: string]: string } }
}

export interface LinkedInConnectionRequest {
  invitee: {
    'com.linkedin.voyager.growth.invitation.InviteeProfile': {
      profileId: string
    }
  }
  message?: string
}

// Analytics interfaces
export interface LinkedInPageStatistics {
  timeRange: {
    start: number
    end: number
  }
  totalPageStatistics: {
    views: {
      allPageViews: {
        pageViews: number
        uniquePageViews: number
      }
      desktopPageViews: {
        pageViews: number
        uniquePageViews: number
      }
      mobilePageViews: {
        pageViews: number
        uniquePageViews: number
      }
    }
    clicks: {
      careersPageClicks: {
        careersPageBannerPromoClicks: number
        careersPageEmployeesClicks: number
        careersPageJobsClicks: number
      }
      mobileCareersPageClicks: {
        mobileCareersPageBannerPromoClicks: number
        mobileCareersPageEmployeesClicks: number
        mobileCareersPageJobsClicks: number
      }
    }
  }
}

// Lead Gen Form interfaces
export interface LinkedInLeadGenForm {
  id: number
  account: string
  name: {
    localized: { [locale: string]: string }
  }
  locale: { language: string; country: string }
  type: 'SPONSORED_CONTENT' | 'SPONSORED_INMAIL'
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  privacyPolicy: {
    text: {
      localized: { [locale: string]: string }
    }
    isDefault: boolean
  }
  created: number
  lastModified: number
}

export interface LinkedInLeadGenFormResponse {
  id: string
  formUrn: string
  submittedAt: number
  testLead: boolean
  answers: Array<{
    questionId: string
    answerDetails: {
      textQuestionAnswer?: { answer: string }
      singleLineTextQuestionAnswer?: { answer: string }
      multipleChoiceQuestionAnswer?: { answers: string[] }
    }
  }>
}

export class LinkedInAdapter extends BaseIntegrationAdapter {
  private accessToken?: string
  private baseUrl = 'https://api.linkedin.com/v2'

  getCapabilities(): IntegrationCapabilities {
    return {
      canSendMessages: true, canReceiveMessages: true, canSendFiles: true, canSendImages: true,
      canSendVideo: true, canSendAudio: false, canSendLocation: false, canSendButtons: false,
      canSendCards: true, canSendCarousels: false, canSendQuickReplies: false, canSendTemplates: false,
      canScheduleMessages: false, canBroadcast: true, canTag: true, canAssign: false,
      canCreateTickets: false, canCreateLeads: true, canCreateContacts: true, canSyncContacts: true,
      canSyncConversations: true, canSyncTickets: false, canExportData: true, canImportData: false,
      canTrackEvents: true, canTrackMetrics: true, canGenerateReports: true, canCreateWorkflows: false,
      canTriggerActions: true, canListenToWebhooks: true, maxMessageLength: 1900,
      maxFileSize: 100 * 1024 * 1024, maxBatchSize: 25, rateLimit: { messages: 100, period: 'per_day' as const },
    }
  }

  async connect(): Promise<IntegrationResponse<void>> {
    this.accessToken = this.config.credentials.accessToken
    if (!this.accessToken) {
      return { success: false, error: { code: 'AUTH_ERROR', message: 'Missing access token', retryable: false } }
    }
    this.isConnected = true
    return { success: true, data: undefined }
  }

  async disconnect(): Promise<IntegrationResponse<void>> {
    this.isConnected = false
    return { success: true, data: undefined }
  }

  async testConnection(): Promise<IntegrationResponse<boolean>> {
    try {
      await this.ensureConnected()
      const result = await this.getProfile()
      return { success: result.success, data: result.success }
    } catch (error: any) {
      return { success: false, data: false, error: this.formatError(error) }
    }
  }

  private getHeaders(additionalHeaders?: Record<string, string>): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'LinkedIn-Version': '202401',
      'X-Restli-Protocol-Version': '2.0.0',
      ...additionalHeaders,
    }
  }

  private async makeLinkedInRequest(endpoint: string, options?: RequestInit): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers: {
            ...this.getHeaders(),
            ...options?.headers,
          },
        })
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`LinkedIn API error: ${response.status} - ${errorText}`)
        }
        const text = await response.text()
        return text ? JSON.parse(text) : {}
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============ Profile Management ============

  async getProfile(fields?: string): Promise<IntegrationResponse<LinkedInProfile>> {
    const fieldsParam = fields || 'id,firstName,lastName,headline,vanityName,profilePicture(displayImage~:playableStreams)'
    return this.makeLinkedInRequest(`/me?projection=(${fieldsParam})`)
  }

  async getProfileById(personId: string, fields?: string): Promise<IntegrationResponse<LinkedInProfile>> {
    const fieldsParam = fields || 'id,firstName,lastName,headline,vanityName'
    return this.makeLinkedInRequest(`/people/(id:${personId})?projection=(${fieldsParam})`)
  }

  // ============ UGC Posts (User Generated Content) ============

  async createPost(post: LinkedInUGCPost): Promise<IntegrationResponse<{ id: string }>> {
    return this.makeLinkedInRequest('/ugcPosts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post),
    })
  }

  async createSimplePost(authorUrn: string, text: string, visibility: 'PUBLIC' | 'CONNECTIONS' = 'PUBLIC'): Promise<IntegrationResponse<{ id: string }>> {
    const post: LinkedInUGCPost = {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': visibility,
      },
    }
    return this.createPost(post)
  }

  async createImagePost(authorUrn: string, text: string, imageUrn: string, visibility: 'PUBLIC' | 'CONNECTIONS' = 'PUBLIC'): Promise<IntegrationResponse<{ id: string }>> {
    const post: LinkedInUGCPost = {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text },
          shareMediaCategory: 'IMAGE',
          media: [{
            status: 'READY',
            media: imageUrn,
          }],
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': visibility,
      },
    }
    return this.createPost(post)
  }

  async createVideoPost(authorUrn: string, text: string, videoUrn: string, thumbnailUrn?: string): Promise<IntegrationResponse<{ id: string }>> {
    const post: LinkedInUGCPost = {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text },
          shareMediaCategory: 'VIDEO',
          media: [{
            status: 'READY',
            media: videoUrn,
            thumbnails: thumbnailUrn ? [thumbnailUrn] : undefined,
          }],
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    }
    return this.createPost(post)
  }

  async createArticlePost(authorUrn: string, text: string, articleUrl: string, title?: string, description?: string): Promise<IntegrationResponse<{ id: string }>> {
    const post: LinkedInUGCPost = {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text },
          shareMediaCategory: 'ARTICLE',
          media: [{
            status: 'READY',
            originalUrl: articleUrl,
            title: title ? { text: title } : undefined,
            description: description ? { text: description } : undefined,
            media: '', // Will be generated by LinkedIn
          }],
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    }
    return this.createPost(post)
  }

  async getPost(postId: string): Promise<IntegrationResponse<LinkedInPost>> {
    return this.makeLinkedInRequest(`/ugcPosts/${postId}`)
  }

  async deletePost(postId: string): Promise<IntegrationResponse<void>> {
    return this.makeLinkedInRequest(`/ugcPosts/${postId}`, {
      method: 'DELETE',
    })
  }

  async getPostStatistics(postId: string): Promise<IntegrationResponse<LinkedInShareStatistics>> {
    return this.makeLinkedInRequest(`/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=${postId}`)
  }

  // ============ Media Upload ============

  async registerImageUpload(personUrn: string): Promise<IntegrationResponse<LinkedInMediaUpload>> {
    const request: LinkedInRegisterUploadRequest = {
      registerUploadRequest: {
        recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
        owner: personUrn,
        serviceRelationships: [{
          relationshipType: 'OWNER',
          identifier: 'urn:li:userGeneratedContent',
        }],
      },
    }

    return this.makeLinkedInRequest('/assets?action=registerUpload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
  }

  async registerVideoUpload(personUrn: string): Promise<IntegrationResponse<LinkedInMediaUpload>> {
    const request: LinkedInRegisterUploadRequest = {
      registerUploadRequest: {
        recipes: ['urn:li:digitalmediaRecipe:feedshare-video'],
        owner: personUrn,
        serviceRelationships: [{
          relationshipType: 'OWNER',
          identifier: 'urn:li:userGeneratedContent',
        }],
      },
    }

    return this.makeLinkedInRequest('/assets?action=registerUpload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
  }

  async uploadMedia(uploadUrl: string, mediaData: ArrayBuffer, headers: Record<string, string>): Promise<IntegrationResponse<void>> {
    try {
      const result = await this.makeRequest(async () => {
        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers,
          body: mediaData,
        })
        if (!response.ok) throw new Error(`Media upload error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============ Organization/Company Management ============

  async getOrganization(organizationId: number): Promise<IntegrationResponse<LinkedInOrganization>> {
    return this.makeLinkedInRequest(`/organizations/${organizationId}`)
  }

  async getOrganizationFollowerStatistics(organizationUrn: string, params?: {
    timeIntervals?: { start: number; end: number }
  }): Promise<IntegrationResponse<LinkedInOrganizationFollowerStatistics>> {
    const query = new URLSearchParams()
    query.set('q', 'organizationalEntity')
    query.set('organizationalEntity', organizationUrn)
    if (params?.timeIntervals) {
      query.set('timeIntervals.start', params.timeIntervals.start.toString())
      query.set('timeIntervals.end', params.timeIntervals.end.toString())
    }

    return this.makeLinkedInRequest(`/organizationalEntityFollowerStatistics?${query}`)
  }

  async getOrganizationPageStatistics(organizationUrn: string, timeRange: { start: number; end: number }): Promise<IntegrationResponse<LinkedInPageStatistics>> {
    const query = new URLSearchParams()
    query.set('q', 'organization')
    query.set('organization', organizationUrn)
    query.set('timeRange.start', timeRange.start.toString())
    query.set('timeRange.end', timeRange.end.toString())

    return this.makeLinkedInRequest(`/organizationPageStatistics?${query}`)
  }

  // ============ Messaging ============

  async getConversations(params?: { start?: number; count?: number }): Promise<IntegrationResponse<{ elements: LinkedInConversation[] }>> {
    const query = new URLSearchParams()
    if (params?.start) query.set('start', params.start.toString())
    if (params?.count) query.set('count', params.count.toString())

    return this.makeLinkedInRequest(`/conversations${query.toString() ? `?${query}` : ''}`)
  }

  async getConversation(conversationId: string): Promise<IntegrationResponse<LinkedInConversation>> {
    return this.makeLinkedInRequest(`/conversations/${conversationId}`)
  }

  async getMessages(conversationId: string, params?: { start?: number; count?: number }): Promise<IntegrationResponse<{ elements: LinkedInMessage[] }>> {
    const query = new URLSearchParams()
    query.set('q', 'conversation')
    query.set('conversation', conversationId)
    if (params?.start) query.set('start', params.start.toString())
    if (params?.count) query.set('count', params.count.toString())

    return this.makeLinkedInRequest(`/messages${query.toString() ? `?${query}` : ''}`)
  }

  async sendMessage(conversationId: string, text: string): Promise<IntegrationResponse<{ messageId: string }>> {
    const message = {
      body: { text },
      conversationId,
    }

    return this.makeLinkedInRequest('/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    })
  }

  async markConversationAsRead(conversationId: string): Promise<IntegrationResponse<void>> {
    return this.makeLinkedInRequest(`/conversations/${conversationId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ read: true }),
    })
  }

  // ============ Connections ============

  async getConnections(params?: { start?: number; count?: number }): Promise<IntegrationResponse<{ elements: LinkedInConnection[] }>> {
    const query = new URLSearchParams()
    query.set('q', 'viewer')
    if (params?.start) query.set('start', params.start.toString())
    if (params?.count) query.set('count', params.count.toString())

    return this.makeLinkedInRequest(`/connections${query.toString() ? `?${query}` : ''}`)
  }

  async sendConnectionRequest(profileId: string, message?: string): Promise<IntegrationResponse<{ invitationId: string }>> {
    const request: LinkedInConnectionRequest = {
      invitee: {
        'com.linkedin.voyager.growth.invitation.InviteeProfile': {
          profileId,
        },
      },
      message,
    }

    return this.makeLinkedInRequest('/voyager/api/growth/normInvitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
  }

  // ============ Lead Gen Forms ============

  async getLeadGenForms(account: string): Promise<IntegrationResponse<{ elements: LinkedInLeadGenForm[] }>> {
    const query = new URLSearchParams()
    query.set('q', 'account')
    query.set('account', account)

    return this.makeLinkedInRequest(`/leadGenForms${query.toString() ? `?${query}` : ''}`)
  }

  async getLeadGenForm(formId: number): Promise<IntegrationResponse<LinkedInLeadGenForm>> {
    return this.makeLinkedInRequest(`/leadGenForms/${formId}`)
  }

  async getLeadGenFormResponses(formId: number, params?: { start?: number; count?: number }): Promise<IntegrationResponse<{ elements: LinkedInLeadGenFormResponse[] }>> {
    const query = new URLSearchParams()
    query.set('q', 'leadGenForm')
    query.set('leadGenForm', `urn:li:leadGenForm:${formId}`)
    if (params?.start) query.set('start', params.start.toString())
    if (params?.count) query.set('count', params.count.toString())

    return this.makeLinkedInRequest(`/leadGenFormResponses${query.toString() ? `?${query}` : ''}`)
  }

  // ============ Search ============

  async searchPeople(keywords: string, params?: { start?: number; count?: number }): Promise<IntegrationResponse<{ elements: LinkedInProfile[] }>> {
    const query = new URLSearchParams()
    query.set('keywords', keywords)
    if (params?.start) query.set('start', params.start.toString())
    if (params?.count) query.set('count', params.count.toString())

    return this.makeLinkedInRequest(`/people?${query}`)
  }

  async searchCompanies(keywords: string, params?: { start?: number; count?: number }): Promise<IntegrationResponse<{ elements: LinkedInOrganization[] }>> {
    const query = new URLSearchParams()
    query.set('keywords', keywords)
    if (params?.start) query.set('start', params.start.toString())
    if (params?.count) query.set('count', params.count.toString())

    return this.makeLinkedInRequest(`/organizations?${query}`)
  }

  // ============ Analytics & Insights ============

  async getShareStatistics(shareUrn: string, params?: {
    timeIntervals?: { start: number; end: number }
    organizationalEntity?: string
  }): Promise<IntegrationResponse<LinkedInShareStatistics>> {
    const query = new URLSearchParams()
    query.set('q', 'organizationalEntity')
    query.set('organizationalEntity', params?.organizationalEntity || shareUrn)
    if (params?.timeIntervals) {
      query.set('timeIntervals.start', params.timeIntervals.start.toString())
      query.set('timeIntervals.end', params.timeIntervals.end.toString())
    }

    return this.makeLinkedInRequest(`/organizationalEntityShareStatistics?${query}`)
  }
}
