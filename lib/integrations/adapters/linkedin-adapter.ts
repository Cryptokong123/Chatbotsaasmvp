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

// Comments
export interface LinkedInComment {
  id: string
  actor: string
  created: { time: number }
  lastModified: { time: number }
  message: { text: string }
  object: string // URN of the post
  likesSummary?: {
    aggregatedTotalLikes: number
    likedByCurrentUser: boolean
  }
}

// Reactions
export interface LinkedInReaction {
  reactionType: 'LIKE' | 'PRAISE' | 'APPRECIATION' | 'EMPATHY' | 'INTEREST' | 'ENTERTAINMENT'
}

// Skills & Endorsements
export interface LinkedInSkill {
  id: string
  name: { localized: { [locale: string]: string } }
}

export interface LinkedInEndorsement {
  endorser: string // URN
  skill: string // Skill URN
  endorsedAt: number
}

// Recommendations
export interface LinkedInRecommendation {
  id: string
  recommender: string // URN
  recommendee: string // URN
  text: string
  created: { time: number }
}

// Job Postings
export interface LinkedInJobPosting {
  id: string
  title: string
  description: string
  companyUrn: string
  location: string
  employmentType?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'TEMPORARY' | 'VOLUNTEER' | 'INTERNSHIP'
  jobFunctions?: string[]
  industries?: string[]
  externalApplicationUrl?: string
  listedAt: number
}

// Company Updates
export interface LinkedInCompanyUpdate {
  id: string
  company: string
  created: { time: number }
  updateContent: any
  reshareContext?: { parent: string }
}

// Events
export interface LinkedInEvent {
  id: string
  name: string
  description: string
  startDate: { year: number; month: number; day: number }
  endDate: { year: number; month: number; day: number }
  timezone: string
  onlineEventUrl?: string
  venue?: {
    name: string
    address: {
      line1?: string
      city?: string
      geographicArea?: string
      postalCode?: string
      country?: string
    }
  }
}

// Groups
export interface LinkedInGroup {
  id: string
  name: string
  description: string
  rules?: string
  memberCount?: number
  created: { time: number }
}

// Following
export interface LinkedInFollowing {
  followedEntity: string // URN
  followedAt: number
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

  // ============ Comments ============

  async createComment(postUrn: string, text: string): Promise<IntegrationResponse<LinkedInComment>> {
    const comment = {
      actor: `urn:li:person:${await this.getCurrentPersonId()}`,
      object: postUrn,
      message: { text },
    }

    return this.makeLinkedInRequest('/socialActions/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comment),
    })
  }

  async getComments(postUrn: string, params?: { start?: number; count?: number }): Promise<IntegrationResponse<{ elements: LinkedInComment[] }>> {
    const query = new URLSearchParams()
    query.set('q', 'object')
    query.set('object', postUrn)
    if (params?.start) query.set('start', params.start.toString())
    if (params?.count) query.set('count', params.count.toString())

    return this.makeLinkedInRequest(`/socialActions/comments?${query}`)
  }

  async deleteComment(commentUrn: string): Promise<IntegrationResponse<void>> {
    return this.makeLinkedInRequest(`/socialActions/comments/${commentUrn}`, {
      method: 'DELETE',
    })
  }

  async updateComment(commentUrn: string, text: string): Promise<IntegrationResponse<LinkedInComment>> {
    return this.makeLinkedInRequest(`/socialActions/comments/${commentUrn}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: { text } }),
    })
  }

  // ============ Reactions (Likes) ============

  async likePost(postUrn: string): Promise<IntegrationResponse<void>> {
    return this.addReaction(postUrn, 'LIKE')
  }

  async addReaction(postUrn: string, reactionType: LinkedInReaction['reactionType']): Promise<IntegrationResponse<void>> {
    const reaction = {
      actor: `urn:li:person:${await this.getCurrentPersonId()}`,
      object: postUrn,
      reactionType,
    }

    return this.makeLinkedInRequest('/socialActions/reactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reaction),
    })
  }

  async removeReaction(postUrn: string, reactionType?: LinkedInReaction['reactionType']): Promise<IntegrationResponse<void>> {
    const personId = await this.getCurrentPersonId()
    const actor = `urn:li:person:${personId}`

    const query = new URLSearchParams()
    query.set('actor', actor)
    query.set('object', postUrn)
    if (reactionType) query.set('reactionType', reactionType)

    return this.makeLinkedInRequest(`/socialActions/reactions?${query}`, {
      method: 'DELETE',
    })
  }

  async getReactions(postUrn: string, params?: { start?: number; count?: number }): Promise<IntegrationResponse<{ elements: any[] }>> {
    const query = new URLSearchParams()
    query.set('q', 'object')
    query.set('object', postUrn)
    if (params?.start) query.set('start', params.start.toString())
    if (params?.count) query.set('count', params.count.toString())

    return this.makeLinkedInRequest(`/socialActions/reactions?${query}`)
  }

  // ============ Skills & Endorsements ============

  async getProfileSkills(personUrn: string): Promise<IntegrationResponse<{ elements: LinkedInSkill[] }>> {
    const query = new URLSearchParams()
    query.set('q', 'member')
    query.set('member', personUrn)

    return this.makeLinkedInRequest(`/skills?${query}`)
  }

  async addSkill(skillName: string): Promise<IntegrationResponse<LinkedInSkill>> {
    return this.makeLinkedInRequest('/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: { localized: { en_US: skillName } } }),
    })
  }

  async removeSkill(skillUrn: string): Promise<IntegrationResponse<void>> {
    return this.makeLinkedInRequest(`/skills/${skillUrn}`, {
      method: 'DELETE',
    })
  }

  async endorseSkill(personUrn: string, skillUrn: string): Promise<IntegrationResponse<LinkedInEndorsement>> {
    const endorsement = {
      endorser: `urn:li:person:${await this.getCurrentPersonId()}`,
      skill: skillUrn,
    }

    return this.makeLinkedInRequest('/skillEndorsements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(endorsement),
    })
  }

  // ============ Recommendations ============

  async createRecommendation(recommendeeUrn: string, text: string): Promise<IntegrationResponse<LinkedInRecommendation>> {
    const recommendation = {
      recommender: `urn:li:person:${await this.getCurrentPersonId()}`,
      recommendee: recommendeeUrn,
      text,
    }

    return this.makeLinkedInRequest('/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recommendation),
    })
  }

  async getRecommendations(personUrn: string): Promise<IntegrationResponse<{ elements: LinkedInRecommendation[] }>> {
    const query = new URLSearchParams()
    query.set('q', 'recommendee')
    query.set('recommendee', personUrn)

    return this.makeLinkedInRequest(`/recommendations?${query}`)
  }

  // ============ Job Postings ============

  async getJobPostings(companyUrn: string, params?: { start?: number; count?: number }): Promise<IntegrationResponse<{ elements: LinkedInJobPosting[] }>> {
    const query = new URLSearchParams()
    query.set('q', 'company')
    query.set('company', companyUrn)
    if (params?.start) query.set('start', params.start.toString())
    if (params?.count) query.set('count', params.count.toString())

    return this.makeLinkedInRequest(`/simpleJobPostings?${query}`)
  }

  async getJobPosting(jobId: string): Promise<IntegrationResponse<LinkedInJobPosting>> {
    return this.makeLinkedInRequest(`/simpleJobPostings/${jobId}`)
  }

  async createJobPosting(job: Partial<LinkedInJobPosting>): Promise<IntegrationResponse<LinkedInJobPosting>> {
    return this.makeLinkedInRequest('/simpleJobPostings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(job),
    })
  }

  async updateJobPosting(jobId: string, updates: Partial<LinkedInJobPosting>): Promise<IntegrationResponse<LinkedInJobPosting>> {
    return this.makeLinkedInRequest(`/simpleJobPostings/${jobId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
  }

  async deleteJobPosting(jobId: string): Promise<IntegrationResponse<void>> {
    return this.makeLinkedInRequest(`/simpleJobPostings/${jobId}`, {
      method: 'DELETE',
    })
  }

  // ============ Company Pages ============

  async getOrganizationBrandStatistics(organizationUrn: string, brand: string, timeRange: { start: number; end: number }): Promise<IntegrationResponse<any>> {
    const query = new URLSearchParams()
    query.set('q', 'organizationalEntity')
    query.set('organizationalEntity', organizationUrn)
    query.set('brand', brand)
    query.set('timeRange.start', timeRange.start.toString())
    query.set('timeRange.end', timeRange.end.toString())

    return this.makeLinkedInRequest(`/organizationBrandStatistics?${query}`)
  }

  async getOrganizationShareStatistics(organizationUrn: string, timeRange: { start: number; end: number }): Promise<IntegrationResponse<any>> {
    const query = new URLSearchParams()
    query.set('q', 'organizationalEntity')
    query.set('organizationalEntity', organizationUrn)
    query.set('timeRange.start', timeRange.start.toString())
    query.set('timeRange.end', timeRange.end.toString())

    return this.makeLinkedInRequest(`/organizationalEntityShareStatistics?${query}`)
  }

  async getCompanyUpdates(companyUrn: string, params?: { start?: number; count?: number }): Promise<IntegrationResponse<{ elements: LinkedInCompanyUpdate[] }>> {
    const query = new URLSearchParams()
    query.set('q', 'company')
    query.set('company', companyUrn)
    if (params?.start) query.set('start', params.start.toString())
    if (params?.count) query.set('count', params.count.toString())

    return this.makeLinkedInRequest(`/ugcPosts?${query}`)
  }

  // ============ Events ============

  async createEvent(event: Partial<LinkedInEvent>): Promise<IntegrationResponse<LinkedInEvent>> {
    return this.makeLinkedInRequest('/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    })
  }

  async getEvent(eventId: string): Promise<IntegrationResponse<LinkedInEvent>> {
    return this.makeLinkedInRequest(`/events/${eventId}`)
  }

  async updateEvent(eventId: string, updates: Partial<LinkedInEvent>): Promise<IntegrationResponse<LinkedInEvent>> {
    return this.makeLinkedInRequest(`/events/${eventId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
  }

  async deleteEvent(eventId: string): Promise<IntegrationResponse<void>> {
    return this.makeLinkedInRequest(`/events/${eventId}`, {
      method: 'DELETE',
    })
  }

  async getEventAttendees(eventId: string, params?: { start?: number; count?: number }): Promise<IntegrationResponse<{ elements: any[] }>> {
    const query = new URLSearchParams()
    query.set('q', 'event')
    query.set('event', eventId)
    if (params?.start) query.set('start', params.start.toString())
    if (params?.count) query.set('count', params.count.toString())

    return this.makeLinkedInRequest(`/eventAttendees?${query}`)
  }

  // ============ Groups ============

  async getGroups(params?: { start?: number; count?: number }): Promise<IntegrationResponse<{ elements: LinkedInGroup[] }>> {
    const query = new URLSearchParams()
    query.set('q', 'member')
    query.set('member', `urn:li:person:${await this.getCurrentPersonId()}`)
    if (params?.start) query.set('start', params.start.toString())
    if (params?.count) query.set('count', params.count.toString())

    return this.makeLinkedInRequest(`/groups?${query}`)
  }

  async getGroup(groupId: string): Promise<IntegrationResponse<LinkedInGroup>> {
    return this.makeLinkedInRequest(`/groups/${groupId}`)
  }

  async joinGroup(groupId: string): Promise<IntegrationResponse<void>> {
    return this.makeLinkedInRequest('/groupMemberships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        group: groupId,
        member: `urn:li:person:${await this.getCurrentPersonId()}`,
      }),
    })
  }

  async leaveGroup(groupId: string): Promise<IntegrationResponse<void>> {
    const personId = await this.getCurrentPersonId()
    return this.makeLinkedInRequest(`/groupMemberships/(group:${groupId},member:urn:li:person:${personId})`, {
      method: 'DELETE',
    })
  }

  async getGroupPosts(groupId: string, params?: { start?: number; count?: number }): Promise<IntegrationResponse<{ elements: any[] }>> {
    const query = new URLSearchParams()
    query.set('q', 'group')
    query.set('group', groupId)
    if (params?.start) query.set('start', params.start.toString())
    if (params?.count) query.set('count', params.count.toString())

    return this.makeLinkedInRequest(`/posts?${query}`)
  }

  async createGroupPost(groupId: string, text: string): Promise<IntegrationResponse<{ id: string }>> {
    const post = {
      author: `urn:li:person:${await this.getCurrentPersonId()}`,
      containerEntity: groupId,
      commentary: text,
    }

    return this.makeLinkedInRequest('/ugcPosts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post),
    })
  }

  // ============ Following ============

  async followCompany(companyUrn: string): Promise<IntegrationResponse<void>> {
    return this.makeLinkedInRequest('/follows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        followedEntity: companyUrn,
        follower: `urn:li:person:${await this.getCurrentPersonId()}`,
      }),
    })
  }

  async unfollowCompany(companyUrn: string): Promise<IntegrationResponse<void>> {
    const personId = await this.getCurrentPersonId()
    return this.makeLinkedInRequest(`/follows/(follower:urn:li:person:${personId},followedEntity:${companyUrn})`, {
      method: 'DELETE',
    })
  }

  async getFollowing(params?: { start?: number; count?: number }): Promise<IntegrationResponse<{ elements: LinkedInFollowing[] }>> {
    const query = new URLSearchParams()
    query.set('q', 'follower')
    query.set('follower', `urn:li:person:${await this.getCurrentPersonId()}`)
    if (params?.start) query.set('start', params.start.toString())
    if (params?.count) query.set('count', params.count.toString())

    return this.makeLinkedInRequest(`/follows?${query}`)
  }

  // ============ Rich Media ============

  async uploadImageAndCreatePost(authorUrn: string, text: string, imageData: ArrayBuffer, visibility: 'PUBLIC' | 'CONNECTIONS' = 'PUBLIC'): Promise<IntegrationResponse<{ id: string }>> {
    // Step 1: Register upload
    const registerResult = await this.registerImageUpload(authorUrn)
    if (!registerResult.success || !registerResult.data) {
      return { success: false, error: registerResult.error }
    }

    const uploadInfo = registerResult.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']
    const assetUrn = registerResult.data.value.asset

    // Step 2: Upload media
    const uploadResult = await this.uploadMedia(uploadInfo.uploadUrl, imageData, uploadInfo.headers)
    if (!uploadResult.success) {
      return { success: false, error: uploadResult.error }
    }

    // Step 3: Create post with media
    return this.createImagePost(authorUrn, text, assetUrn, visibility)
  }

  async uploadVideoAndCreatePost(authorUrn: string, text: string, videoData: ArrayBuffer): Promise<IntegrationResponse<{ id: string }>> {
    // Step 1: Register upload
    const registerResult = await this.registerVideoUpload(authorUrn)
    if (!registerResult.success || !registerResult.data) {
      return { success: false, error: registerResult.error }
    }

    const uploadInfo = registerResult.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']
    const assetUrn = registerResult.data.value.asset

    // Step 2: Upload media
    const uploadResult = await this.uploadMedia(uploadInfo.uploadUrl, videoData, uploadInfo.headers)
    if (!uploadResult.success) {
      return { success: false, error: uploadResult.error }
    }

    // Step 3: Create post with media
    return this.createVideoPost(authorUrn, text, assetUrn)
  }

  // ============ Advanced Analytics ============

  async getPostEngagementMetrics(postUrn: string): Promise<IntegrationResponse<any>> {
    const query = new URLSearchParams()
    query.set('q', 'share')
    query.set('share', postUrn)

    return this.makeLinkedInRequest(`/socialMetadata/shareStatistics?${query}`)
  }

  async getVideoAnalytics(videoUrn: string, timeRange: { start: number; end: number }): Promise<IntegrationResponse<any>> {
    const query = new URLSearchParams()
    query.set('q', 'video')
    query.set('video', videoUrn)
    query.set('timeRange.start', timeRange.start.toString())
    query.set('timeRange.end', timeRange.end.toString())

    return this.makeLinkedInRequest(`/videoAnalytics?${query}`)
  }

  async getCompanyDemographics(companyUrn: string, timeRange: { start: number; end: number }): Promise<IntegrationResponse<any>> {
    const query = new URLSearchParams()
    query.set('q', 'organizationalEntity')
    query.set('organizationalEntity', companyUrn)
    query.set('timeRange.start', timeRange.start.toString())
    query.set('timeRange.end', timeRange.end.toString())

    return this.makeLinkedInRequest(`/organizationalEntityFollowerStatistics?${query}`)
  }

  // ============ Profile Updates ============

  async updateProfileHeadline(headline: string): Promise<IntegrationResponse<void>> {
    return this.makeLinkedInRequest('/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        headline: { localized: { en_US: headline } },
      }),
    })
  }

  async updateProfileSummary(summary: string): Promise<IntegrationResponse<void>> {
    return this.makeLinkedInRequest('/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary: { localized: { en_US: summary } },
      }),
    })
  }

  // ============ Helper Methods ============

  private async getCurrentPersonId(): Promise<string> {
    const profile = await this.getProfile('id')
    if (!profile.success || !profile.data) {
      throw new Error('Unable to fetch current person ID')
    }
    return profile.data.id
  }

  async getMemberIdentity(): Promise<IntegrationResponse<{ id: string; vanityName: string }>> {
    return this.getProfile('id,vanityName') as Promise<IntegrationResponse<{ id: string; vanityName: string }>>
  }

  async getProfilePictureUrl(): Promise<IntegrationResponse<string | null>> {
    const profile = await this.getProfile('profilePicture(displayImage~:playableStreams)')
    if (!profile.success || !profile.data?.profilePicture) {
      return { success: true, data: null }
    }

    const elements = profile.data.profilePicture['displayImage~']?.elements
    if (!elements || elements.length === 0) {
      return { success: true, data: null }
    }

    const largestImage = elements.reduce((prev, curr) => {
      const prevSize = prev.data['com.linkedin.digitalmedia.mediaartifact.StillImage'].displaySize
      const currSize = curr.data['com.linkedin.digitalmedia.mediaartifact.StillImage'].displaySize
      return (currSize.width * currSize.height) > (prevSize.width * prevSize.height) ? curr : prev
    })

    return {
      success: true,
      data: largestImage.identifiers[0]?.identifier || null,
    }
  }
}
