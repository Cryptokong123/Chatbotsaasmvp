/**
 * Instagram Adapter - Comprehensive Instagram Graph API integration
 * Supports messaging, media management, insights, comments, shopping, and business discovery
 */
import { BaseIntegrationAdapter } from '../base-adapter'
import { IntegrationConfig, IntegrationCapabilities, IntegrationResponse } from '../types'

// Message interfaces
export interface InstagramMessage {
  recipient: { id: string }
  message?: {
    text?: string
    attachment?: {
      type: 'image' | 'video' | 'audio' | 'file' | 'template'
      payload?: {
        url?: string
        is_reusable?: boolean
        template_type?: 'generic' | 'button'
        elements?: any[]
        buttons?: any[]
      }
    }
    quick_replies?: Array<{
      content_type: 'text'
      title: string
      payload?: string
      image_url?: string
    }>
  }
}

export interface InstagramConversation {
  id: string
  updated_time: string
  participants?: {
    data: Array<{
      id: string
      username: string
      name: string
    }>
  }
  messages?: {
    data: InstagramMessageData[]
  }
}

export interface InstagramMessageData {
  id: string
  created_time: string
  from: { id: string; username?: string }
  to: { data: Array<{ id: string; username?: string }> }
  message?: string
  attachments?: {
    data: Array<{
      image_data?: { url: string; preview_url: string }
      video_data?: { url: string; preview_url: string }
      file_url?: string
    }>
  }
}

// Media interfaces
export interface InstagramMedia {
  id?: string
  caption?: string
  media_type?: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  media_url?: string
  permalink?: string
  thumbnail_url?: string
  timestamp?: string
  username?: string
  children?: {
    data: Array<{
      id: string
      media_type: string
      media_url: string
    }>
  }
  like_count?: number
  comments_count?: number
  is_comment_enabled?: boolean
  owner?: { id: string }
}

export interface InstagramMediaContainer {
  id: string
  status?: 'EXPIRED' | 'ERROR' | 'FINISHED' | 'IN_PROGRESS' | 'PUBLISHED'
  status_code?: string
}

export interface InstagramStory {
  id: string
  media_type: 'IMAGE' | 'VIDEO'
  media_url: string
  permalink: string
  thumbnail_url?: string
  timestamp: string
  username: string
}

// Comment interfaces
export interface InstagramComment {
  id?: string
  text: string
  from?: { id: string; username: string }
  timestamp?: string
  like_count?: number
  hidden?: boolean
  user?: { id: string; username: string }
  replies?: {
    data: InstagramComment[]
  }
}

// Insights interfaces
export interface InstagramInsight {
  name: string
  period: 'day' | 'week' | 'days_28' | 'lifetime'
  values: Array<{
    value: number | { [key: string]: number }
    end_time: string
  }>
  title?: string
  description?: string
  id?: string
}

export interface InstagramAccountInsights {
  impressions: number
  reach: number
  profile_views: number
  follower_count: number
  website_clicks: number
  email_contacts: number
  phone_call_clicks: number
  text_message_clicks: number
  get_directions_clicks: number
}

export interface InstagramMediaInsights {
  impressions: number
  reach: number
  engagement: number
  saved: number
  video_views?: number
  likes: number
  comments: number
  shares: number
}

// User/Account interfaces
export interface InstagramUser {
  id: string
  username: string
  name?: string
  profile_picture_url?: string
  followers_count?: number
  follows_count?: number
  media_count?: number
  biography?: string
  website?: string
  ig_id?: number
}

export interface InstagramBusinessAccount {
  id: string
  username: string
  name: string
  profile_picture_url: string
  followers_count: number
  follows_count: number
  media_count: number
  biography: string
  website: string
  ig_id: number
}

// Hashtag interfaces
export interface InstagramHashtag {
  id: string
  name: string
}

export interface InstagramHashtagSearch {
  data: Array<{
    id: string
    name: string
  }>
}

export interface InstagramHashtagTopMedia {
  data: InstagramMedia[]
  paging?: {
    cursors: {
      before: string
      after: string
    }
    next?: string
  }
}

// Product tagging interfaces
export interface InstagramProduct {
  id: string
  product_id: string
  merchant_id: string
  name: string
  price: string
  currency: string
  image_url: string
  product_url: string
  retailer_id: string
  review_status: 'approved' | 'rejected' | 'pending' | 'outdated'
}

export interface InstagramProductTag {
  product_id: string
  x: number
  y: number
}

// Mention interfaces
export interface InstagramMention {
  id: string
  caption?: string
  media_type: string
  media_url: string
  permalink: string
  timestamp: string
  username: string
  like_count: number
  comments_count: number
}

export class InstagramAdapter extends BaseIntegrationAdapter {
  private accessToken?: string
  private accountId?: string
  private baseUrl = 'https://graph.facebook.com/v18.0'

  getCapabilities(): IntegrationCapabilities {
    return {
      canSendMessages: true, canReceiveMessages: true, canSendFiles: true, canSendImages: true,
      canSendVideo: true, canSendAudio: true, canSendLocation: false, canSendButtons: true,
      canSendCards: true, canSendCarousels: true, canSendQuickReplies: true, canSendTemplates: true,
      canScheduleMessages: false, canBroadcast: false, canTag: true, canAssign: false,
      canCreateTickets: false, canCreateLeads: true, canCreateContacts: true, canSyncContacts: true,
      canSyncConversations: true, canSyncTickets: false, canExportData: true, canImportData: false,
      canTrackEvents: true, canTrackMetrics: true, canGenerateReports: true, canCreateWorkflows: false,
      canTriggerActions: true, canListenToWebhooks: true, maxMessageLength: 1000,
      maxFileSize: 8 * 1024 * 1024, maxBatchSize: 50, rateLimit: { messages: 200, period: 'per_hour' as const },
    }
  }

  async connect(): Promise<IntegrationResponse<void>> {
    this.accessToken = this.config.credentials.accessToken
    this.accountId = this.config.credentials.accountId
    if (!this.accessToken || !this.accountId) {
      return { success: false, error: { code: 'AUTH_ERROR', message: 'Missing credentials', retryable: false } }
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
      const result = await this.getAccount()
      return { success: result.success, data: result.success }
    } catch (error: any) {
      return { success: false, data: false, error: this.formatError(error) }
    }
  }

  private async makeGraphRequest(endpoint: string, options?: RequestInit): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()
      const url = `${this.baseUrl}${endpoint}`
      const separator = endpoint.includes('?') ? '&' : '?'
      const fullUrl = `${url}${separator}access_token=${this.accessToken}`

      const result = await this.makeRequest(async () => {
        const response = await fetch(fullUrl, options)
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Instagram API error: ${response.status} - ${errorText}`)
        }
        return await response.json()
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============ Messaging ============

  async sendMessage(message: InstagramMessage): Promise<IntegrationResponse<{ message_id: string; recipient_id: string }>> {
    return this.makeGraphRequest('/me/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    })
  }

  async sendTextMessage(recipientId: string, text: string): Promise<IntegrationResponse<{ message_id: string }>> {
    return this.sendMessage({
      recipient: { id: recipientId },
      message: { text },
    })
  }

  async sendImageMessage(recipientId: string, imageUrl: string, isReusable = true): Promise<IntegrationResponse<{ message_id: string }>> {
    return this.sendMessage({
      recipient: { id: recipientId },
      message: {
        attachment: {
          type: 'image',
          payload: { url: imageUrl, is_reusable: isReusable },
        },
      },
    })
  }

  async sendVideoMessage(recipientId: string, videoUrl: string, isReusable = true): Promise<IntegrationResponse<{ message_id: string }>> {
    return this.sendMessage({
      recipient: { id: recipientId },
      message: {
        attachment: {
          type: 'video',
          payload: { url: videoUrl, is_reusable: isReusable },
        },
      },
    })
  }

  async sendQuickReplies(recipientId: string, text: string, quickReplies: Array<{ title: string; payload?: string }>): Promise<IntegrationResponse<{ message_id: string }>> {
    return this.sendMessage({
      recipient: { id: recipientId },
      message: {
        text,
        quick_replies: quickReplies.map(qr => ({
          content_type: 'text',
          title: qr.title,
          payload: qr.payload || qr.title,
        })),
      },
    })
  }

  async sendGenericTemplate(recipientId: string, elements: any[]): Promise<IntegrationResponse<{ message_id: string }>> {
    return this.sendMessage({
      recipient: { id: recipientId },
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'generic',
            elements,
          },
        },
      },
    })
  }

  async getConversations(params?: { platform?: 'instagram'; user_id?: string }): Promise<IntegrationResponse<{ data: InstagramConversation[] }>> {
    const query = new URLSearchParams()
    if (params?.platform) query.set('platform', params.platform)
    if (params?.user_id) query.set('user_id', params.user_id)

    return this.makeGraphRequest(`/${this.accountId}/conversations${query.toString() ? `?${query}` : ''}`)
  }

  async getConversation(conversationId: string, fields?: string): Promise<IntegrationResponse<InstagramConversation>> {
    const fieldsParam = fields || 'id,updated_time,participants,messages{id,created_time,from,to,message,attachments}'
    return this.makeGraphRequest(`/${conversationId}?fields=${fieldsParam}`)
  }

  async getMessages(conversationId: string): Promise<IntegrationResponse<{ data: InstagramMessageData[] }>> {
    return this.makeGraphRequest(`/${conversationId}/messages?fields=id,created_time,from,to,message,attachments`)
  }

  // ============ Account Management ============

  async getAccount(fields?: string): Promise<IntegrationResponse<InstagramUser>> {
    const fieldsParam = fields || 'id,username,name,profile_picture_url,followers_count,follows_count,media_count,biography,website,ig_id'
    return this.makeGraphRequest(`/${this.accountId}?fields=${fieldsParam}`)
  }

  async getBusinessDiscovery(username: string, fields?: string): Promise<IntegrationResponse<InstagramBusinessAccount>> {
    const fieldsParam = fields || 'id,username,name,profile_picture_url,followers_count,follows_count,media_count,biography,website,ig_id'
    return this.makeGraphRequest(`/${this.accountId}?fields=business_discovery.username(${username}){${fieldsParam}}`)
  }

  // ============ Media Management ============

  async getMedia(params?: { limit?: number; since?: string; until?: string }): Promise<IntegrationResponse<{ data: InstagramMedia[]; paging?: any }>> {
    const query = new URLSearchParams()
    query.set('fields', 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username,like_count,comments_count')
    if (params?.limit) query.set('limit', params.limit.toString())
    if (params?.since) query.set('since', params.since)
    if (params?.until) query.set('until', params.until)

    return this.makeGraphRequest(`/${this.accountId}/media?${query}`)
  }

  async getMediaItem(mediaId: string, fields?: string): Promise<IntegrationResponse<InstagramMedia>> {
    const fieldsParam = fields || 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username,like_count,comments_count,is_comment_enabled,children{id,media_type,media_url}'
    return this.makeGraphRequest(`/${mediaId}?fields=${fieldsParam}`)
  }

  async createMediaContainer(params: {
    image_url?: string
    video_url?: string
    caption?: string
    location_id?: string
    user_tags?: Array<{ username: string; x: number; y: number }>
    product_tags?: InstagramProductTag[]
    children?: string[]
  }): Promise<IntegrationResponse<InstagramMediaContainer>> {
    const formData = new URLSearchParams()
    if (params.image_url) formData.append('image_url', params.image_url)
    if (params.video_url) formData.append('video_url', params.video_url)
    if (params.caption) formData.append('caption', params.caption)
    if (params.location_id) formData.append('location_id', params.location_id)
    if (params.user_tags) formData.append('user_tags', JSON.stringify(params.user_tags))
    if (params.product_tags) formData.append('product_tags', JSON.stringify(params.product_tags))
    if (params.children) {
      formData.append('media_type', 'CAROUSEL')
      formData.append('children', params.children.join(','))
    }

    return this.makeGraphRequest(`/${this.accountId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    })
  }

  async publishMedia(creationId: string): Promise<IntegrationResponse<{ id: string }>> {
    const formData = new URLSearchParams()
    formData.append('creation_id', creationId)

    return this.makeGraphRequest(`/${this.accountId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    })
  }

  async deleteMedia(mediaId: string): Promise<IntegrationResponse<{ success: boolean }>> {
    return this.makeGraphRequest(`/${mediaId}`, {
      method: 'DELETE',
    })
  }

  async getStories(): Promise<IntegrationResponse<{ data: InstagramStory[] }>> {
    return this.makeGraphRequest(`/${this.accountId}/stories?fields=id,media_type,media_url,permalink,thumbnail_url,timestamp,username`)
  }

  // ============ Comment Management ============

  async getComments(mediaId: string): Promise<IntegrationResponse<{ data: InstagramComment[] }>> {
    return this.makeGraphRequest(`/${mediaId}/comments?fields=id,text,from,timestamp,like_count,hidden,user,replies{id,text,from,timestamp}`)
  }

  async getComment(commentId: string): Promise<IntegrationResponse<InstagramComment>> {
    return this.makeGraphRequest(`/${commentId}?fields=id,text,from,timestamp,like_count,hidden,user,replies`)
  }

  async createComment(mediaId: string, text: string): Promise<IntegrationResponse<{ id: string }>> {
    const formData = new URLSearchParams()
    formData.append('message', text)

    return this.makeGraphRequest(`/${mediaId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    })
  }

  async replyToComment(commentId: string, text: string): Promise<IntegrationResponse<{ id: string }>> {
    const formData = new URLSearchParams()
    formData.append('message', text)

    return this.makeGraphRequest(`/${commentId}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    })
  }

  async deleteComment(commentId: string): Promise<IntegrationResponse<{ success: boolean }>> {
    return this.makeGraphRequest(`/${commentId}`, {
      method: 'DELETE',
    })
  }

  async hideComment(commentId: string, hide = true): Promise<IntegrationResponse<{ success: boolean }>> {
    const formData = new URLSearchParams()
    formData.append('hide', hide.toString())

    return this.makeGraphRequest(`/${commentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    })
  }

  // ============ Insights & Analytics ============

  async getAccountInsights(params: {
    metric: string[]
    period: 'day' | 'week' | 'days_28' | 'lifetime'
    since?: string
    until?: string
  }): Promise<IntegrationResponse<{ data: InstagramInsight[] }>> {
    const query = new URLSearchParams()
    query.set('metric', params.metric.join(','))
    query.set('period', params.period)
    if (params.since) query.set('since', params.since)
    if (params.until) query.set('until', params.until)

    return this.makeGraphRequest(`/${this.accountId}/insights?${query}`)
  }

  async getMediaInsights(mediaId: string, metric: string[]): Promise<IntegrationResponse<{ data: InstagramInsight[] }>> {
    const query = new URLSearchParams()
    query.set('metric', metric.join(','))

    return this.makeGraphRequest(`/${mediaId}/insights?${query}`)
  }

  async getStoryInsights(storyId: string, metric: string[]): Promise<IntegrationResponse<{ data: InstagramInsight[] }>> {
    const query = new URLSearchParams()
    query.set('metric', metric.join(','))

    return this.makeGraphRequest(`/${storyId}/insights?${query}`)
  }

  async getAudienceInsights(): Promise<IntegrationResponse<{ data: InstagramInsight[] }>> {
    const metrics = [
      'audience_city',
      'audience_country',
      'audience_gender_age',
      'audience_locale',
    ]
    return this.getAccountInsights({ metric: metrics, period: 'lifetime' })
  }

  async getEngagementInsights(since?: string, until?: string): Promise<IntegrationResponse<{ data: InstagramInsight[] }>> {
    const metrics = [
      'impressions',
      'reach',
      'profile_views',
      'website_clicks',
      'follower_count',
    ]
    return this.getAccountInsights({ metric: metrics, period: 'day', since, until })
  }

  // ============ Hashtag Management ============

  async searchHashtags(query: string): Promise<IntegrationResponse<InstagramHashtagSearch>> {
    const params = new URLSearchParams()
    params.set('q', query)

    return this.makeGraphRequest(`/ig_hashtag_search?${params}`)
  }

  async getHashtag(hashtagId: string): Promise<IntegrationResponse<InstagramHashtag>> {
    return this.makeGraphRequest(`/${hashtagId}?fields=id,name`)
  }

  async getHashtagTopMedia(hashtagId: string, fields?: string): Promise<IntegrationResponse<InstagramHashtagTopMedia>> {
    const fieldsParam = fields || 'id,caption,media_type,media_url,permalink,timestamp,username,like_count,comments_count'
    return this.makeGraphRequest(`/${hashtagId}/top_media?fields=${fieldsParam}`)
  }

  async getHashtagRecentMedia(hashtagId: string, fields?: string): Promise<IntegrationResponse<InstagramHashtagTopMedia>> {
    const fieldsParam = fields || 'id,caption,media_type,media_url,permalink,timestamp,username,like_count,comments_count'
    return this.makeGraphRequest(`/${hashtagId}/recent_media?fields=${fieldsParam}`)
  }

  // ============ Mentions ============

  async getMentions(params?: { limit?: number }): Promise<IntegrationResponse<{ data: InstagramMention[] }>> {
    const query = new URLSearchParams()
    query.set('fields', 'id,caption,media_type,media_url,permalink,timestamp,username,like_count,comments_count')
    if (params?.limit) query.set('limit', params.limit.toString())

    return this.makeGraphRequest(`/${this.accountId}/tags?${query}`)
  }

  // ============ Product Tagging ============

  async getCatalog(): Promise<IntegrationResponse<{ data: Array<{ id: string; name: string }> }>> {
    return this.makeGraphRequest(`/${this.accountId}/available_catalogs`)
  }

  async getProducts(catalogId: string): Promise<IntegrationResponse<{ data: InstagramProduct[] }>> {
    return this.makeGraphRequest(`/${catalogId}/products?fields=id,product_id,name,price,currency,image_url,product_url,retailer_id,review_status`)
  }

  async tagProductsInMedia(mediaId: string, productTags: InstagramProductTag[]): Promise<IntegrationResponse<{ success: boolean }>> {
    const formData = new URLSearchParams()
    formData.append('product_tags', JSON.stringify(productTags))

    return this.makeGraphRequest(`/${mediaId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    })
  }

  async getProductAppeal(productId: string): Promise<IntegrationResponse<any>> {
    return this.makeGraphRequest(`/${productId}/appeal`)
  }

  async submitProductAppeal(productId: string, appealReason: string): Promise<IntegrationResponse<{ success: boolean }>> {
    const formData = new URLSearchParams()
    formData.append('appeal_reason', appealReason)

    return this.makeGraphRequest(`/${productId}/appeal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    })
  }

  // ============ User Management ============

  async getUserProfile(userId: string): Promise<IntegrationResponse<InstagramUser>> {
    return this.makeGraphRequest(`/${userId}?fields=id,username,name,profile_picture_url,followers_count,follows_count,media_count`)
  }

  async getFollowers(params?: { limit?: number }): Promise<IntegrationResponse<{ data: InstagramUser[] }>> {
    const query = new URLSearchParams()
    query.set('fields', 'id,username,name,profile_picture_url')
    if (params?.limit) query.set('limit', params.limit.toString())

    return this.makeGraphRequest(`/${this.accountId}/followers?${query}`)
  }

  async getFollowing(params?: { limit?: number }): Promise<IntegrationResponse<{ data: InstagramUser[] }>> {
    const query = new URLSearchParams()
    query.set('fields', 'id,username,name,profile_picture_url')
    if (params?.limit) query.set('limit', params.limit.toString())

    return this.makeGraphRequest(`/${this.accountId}/following?${query}`)
  }

  // ============ Webhook Subscriptions ============

  async subscribeToWebhooks(fields: string[], callbackUrl: string, verifyToken: string): Promise<IntegrationResponse<{ success: boolean }>> {
    const formData = new URLSearchParams()
    formData.append('object', 'instagram')
    formData.append('callback_url', callbackUrl)
    formData.append('fields', fields.join(','))
    formData.append('verify_token', verifyToken)

    return this.makeGraphRequest(`/${this.accountId}/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    })
  }

  async getWebhookSubscriptions(): Promise<IntegrationResponse<{ data: any[] }>> {
    return this.makeGraphRequest(`/${this.accountId}/subscriptions`)
  }

  async deleteWebhookSubscription(subscriptionId: string): Promise<IntegrationResponse<{ success: boolean }>> {
    return this.makeGraphRequest(`/${subscriptionId}`, {
      method: 'DELETE',
    })
  }

  // ============ Content Publishing ============

  async enableComments(mediaId: string, enable = true): Promise<IntegrationResponse<{ success: boolean }>> {
    const formData = new URLSearchParams()
    formData.append('comment_enabled', enable.toString())

    return this.makeGraphRequest(`/${mediaId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    })
  }

  async updateCaption(mediaId: string, caption: string): Promise<IntegrationResponse<{ success: boolean }>> {
    const formData = new URLSearchParams()
    formData.append('caption', caption)

    return this.makeGraphRequest(`/${mediaId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    })
  }
}
