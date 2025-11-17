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

// Story sticker interfaces
export interface InstagramStoryPoll {
  id: string
  question: string
  options: Array<{
    text: string
    count: number
  }>
  poll_id: string
  viewer_vote?: number
  is_shared_result?: boolean
}

export interface InstagramStoryQuestion {
  id: string
  question: string
  responses?: Array<{
    id: string
    text: string
    username: string
  }>
}

export interface InstagramStoryQuiz {
  id: string
  question: string
  options: Array<{
    text: string
    count: number
    is_correct: boolean
  }>
  correct_answer: number
  viewer_answer?: number
}

export interface InstagramStorySlider {
  id: string
  question: string
  emoji: string
  slider_vote_average: number
  viewer_vote?: number
}

export interface InstagramStoryCountdown {
  id: string
  text: string
  end_time: string
  is_owner?: boolean
  follows_viewer?: boolean
}

// Live video interfaces
export interface InstagramLiveVideo {
  id: string
  broadcast_status: 'LIVE' | 'STOPPED' | 'INTERRUPTED'
  dash_playback_url?: string
  is_viewer_comment_allowed: boolean
  permalink?: string
  video?: {
    id: string
    length: number
  }
}

// Reel interfaces
export interface InstagramReel {
  id: string
  caption?: string
  media_type: 'VIDEO'
  media_url: string
  permalink: string
  thumbnail_url: string
  timestamp: string
  username: string
  like_count: number
  comments_count: number
  play_count?: number
  video_title?: string
}

// Shopping interfaces
export interface InstagramProductCollection {
  id: string
  title: string
  description?: string
  products?: {
    data: InstagramProduct[]
  }
}

export interface InstagramOrder {
  id: string
  order_status: 'created' | 'paid' | 'shipped' | 'completed' | 'refunded'
  created: string
  updated: string
  items: Array<{
    product_id: string
    quantity: number
    price: string
    currency: string
  }>
  buyer_info?: {
    email?: string
    name?: string
    shipping_address?: any
  }
}

// Branded content interfaces
export interface InstagramBrandedContent {
  id: string
  sponsor_relationship: boolean
  sponsor_tags?: Array<{
    id: string
    username: string
  }>
}

// Comment filter interfaces
export interface InstagramCommentFilter {
  filter_type: 'default' | 'custom'
  keywords?: string[]
  is_enabled: boolean
}

// Messaging features interfaces
export interface InstagramIceBreaker {
  question: string
  payload: string
}

export interface InstagramAwayMessage {
  enabled: boolean
  message: string
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

  // ============ Story Interactive Stickers ============

  async createStoryWithPoll(params: {
    image_url: string
    question: string
    options: string[]
  }): Promise<IntegrationResponse<InstagramMediaContainer>> {
    const sticker = {
      poll: {
        question: params.question,
        options: params.options.map(opt => ({ text: opt, count: 0 })),
      },
    }

    const formData = new URLSearchParams()
    formData.append('image_url', params.image_url)
    formData.append('media_type', 'STORIES')
    formData.append('stickers', JSON.stringify([sticker]))

    return this.makeGraphRequest(`/${this.accountId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    })
  }

  async getStoryPollResults(storyId: string): Promise<IntegrationResponse<{ data: InstagramStoryPoll[] }>> {
    return this.makeGraphRequest(`/${storyId}?fields=story_poll_results`)
  }

  async createStoryWithQuestion(params: {
    image_url: string
    question: string
  }): Promise<IntegrationResponse<InstagramMediaContainer>> {
    const sticker = {
      question: {
        question: params.question,
      },
    }

    const formData = new URLSearchParams()
    formData.append('image_url', params.image_url)
    formData.append('media_type', 'STORIES')
    formData.append('stickers', JSON.stringify([sticker]))

    return this.makeGraphRequest(`/${this.accountId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    })
  }

  async getStoryQuestionResponses(storyId: string): Promise<IntegrationResponse<{ data: InstagramStoryQuestion[] }>> {
    return this.makeGraphRequest(`/${storyId}/story_question_responses`)
  }

  async createStoryWithQuiz(params: {
    image_url: string
    question: string
    options: Array<{ text: string; is_correct: boolean }>
  }): Promise<IntegrationResponse<InstagramMediaContainer>> {
    const sticker = {
      quiz: {
        question: params.question,
        options: params.options.map((opt, idx) => ({
          text: opt.text,
          count: 0,
          is_correct: opt.is_correct,
        })),
        correct_answer: params.options.findIndex(opt => opt.is_correct),
      },
    }

    const formData = new URLSearchParams()
    formData.append('image_url', params.image_url)
    formData.append('media_type', 'STORIES')
    formData.append('stickers', JSON.stringify([sticker]))

    return this.makeGraphRequest(`/${this.accountId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    })
  }

  async createStoryWithSlider(params: {
    image_url: string
    question: string
    emoji: string
  }): Promise<IntegrationResponse<InstagramMediaContainer>> {
    const sticker = {
      slider: {
        question: params.question,
        emoji: params.emoji,
        slider_vote_average: 0,
      },
    }

    const formData = new URLSearchParams()
    formData.append('image_url', params.image_url)
    formData.append('media_type', 'STORIES')
    formData.append('stickers', JSON.stringify([sticker]))

    return this.makeGraphRequest(`/${this.accountId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    })
  }

  async createStoryWithCountdown(params: {
    image_url: string
    text: string
    end_time: string
  }): Promise<IntegrationResponse<InstagramMediaContainer>> {
    const sticker = {
      countdown: {
        text: params.text,
        end_time: params.end_time,
      },
    }

    const formData = new URLSearchParams()
    formData.append('image_url', params.image_url)
    formData.append('media_type', 'STORIES')
    formData.append('stickers', JSON.stringify([sticker]))

    return this.makeGraphRequest(`/${this.accountId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    })
  }

  // ============ Live Video ============

  async createLiveVideo(params?: {
    title?: string
    description?: string
  }): Promise<IntegrationResponse<InstagramLiveVideo>> {
    const formData = new URLSearchParams()
    if (params?.title) formData.append('title', params.title)
    if (params?.description) formData.append('description', params.description)

    return this.makeGraphRequest(`/${this.accountId}/live_videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    })
  }

  async getLiveVideo(liveVideoId: string): Promise<IntegrationResponse<InstagramLiveVideo>> {
    return this.makeGraphRequest(`/${liveVideoId}?fields=id,broadcast_status,dash_playback_url,is_viewer_comment_allowed,permalink`)
  }

  async startLiveVideo(liveVideoId: string): Promise<IntegrationResponse<{ success: boolean }>> {
    const formData = new URLSearchParams()
    formData.append('broadcast_status', 'LIVE')

    return this.makeGraphRequest(`/${liveVideoId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    })
  }

  async endLiveVideo(liveVideoId: string, shouldSaveToIGTV = false): Promise<IntegrationResponse<{ success: boolean }>> {
    const formData = new URLSearchParams()
    formData.append('end_live_video', 'true')
    if (shouldSaveToIGTV) formData.append('should_save_to_igtv', 'true')

    return this.makeGraphRequest(`/${liveVideoId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    })
  }

  async getLiveVideoComments(liveVideoId: string): Promise<IntegrationResponse<{ data: InstagramComment[] }>> {
    return this.makeGraphRequest(`/${liveVideoId}/comments?fields=id,text,from,timestamp,like_count`)
  }

  async enableLiveVideoComments(liveVideoId: string, enable = true): Promise<IntegrationResponse<{ success: boolean }>> {
    const formData = new URLSearchParams()
    formData.append('is_viewer_comment_allowed', enable.toString())

    return this.makeGraphRequest(`/${liveVideoId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    })
  }

  // ============ Reels ============

  async getReels(params?: { limit?: number }): Promise<IntegrationResponse<{ data: InstagramReel[] }>> {
    const query = new URLSearchParams()
    query.set('fields', 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username,like_count,comments_count,play_count')
    if (params?.limit) query.set('limit', params.limit.toString())

    return this.makeGraphRequest(`/${this.accountId}/media?media_type=REELS&${query}`)
  }

  async createReel(params: {
    video_url: string
    caption?: string
    share_to_feed?: boolean
    cover_url?: string
  }): Promise<IntegrationResponse<InstagramMediaContainer>> {
    const formData = new URLSearchParams()
    formData.append('media_type', 'REELS')
    formData.append('video_url', params.video_url)
    if (params.caption) formData.append('caption', params.caption)
    if (params.share_to_feed !== undefined) formData.append('share_to_feed', params.share_to_feed.toString())
    if (params.cover_url) formData.append('cover_url', params.cover_url)

    return this.makeGraphRequest(`/${this.accountId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    })
  }

  async getReelInsights(reelId: string): Promise<IntegrationResponse<{ data: InstagramInsight[] }>> {
    const metrics = [
      'plays',
      'reach',
      'total_interactions',
      'likes',
      'comments',
      'shares',
      'saved',
    ]

    return this.makeGraphRequest(`/${reelId}/insights?metric=${metrics.join(',')}`)
  }

  // ============ Advanced Comment Management ============

  async bulkHideComments(commentIds: string[], hide = true): Promise<IntegrationResponse<{ success: boolean }>> {
    const results = await Promise.all(
      commentIds.map(id => this.hideComment(id, hide))
    )

    const allSuccess = results.every(r => r.success)
    return { success: allSuccess, data: { success: allSuccess } }
  }

  async bulkDeleteComments(commentIds: string[]): Promise<IntegrationResponse<{ success: boolean }>> {
    const results = await Promise.all(
      commentIds.map(id => this.deleteComment(id))
    )

    const allSuccess = results.every(r => r.success)
    return { success: allSuccess, data: { success: allSuccess } }
  }

  async getCommentFilters(): Promise<IntegrationResponse<InstagramCommentFilter>> {
    return this.makeGraphRequest(`/${this.accountId}/content_publishing_limit`)
  }

  async updateCommentFilter(params: {
    filter_type?: 'default' | 'custom'
    keywords?: string[]
    is_enabled?: boolean
  }): Promise<IntegrationResponse<{ success: boolean }>> {
    const formData = new URLSearchParams()
    if (params.filter_type) formData.append('filter_type', params.filter_type)
    if (params.keywords) formData.append('keywords', params.keywords.join(','))
    if (params.is_enabled !== undefined) formData.append('is_enabled', params.is_enabled.toString())

    return this.makeGraphRequest(`/${this.accountId}/content_publishing_limit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    })
  }

  async likeComment(commentId: string): Promise<IntegrationResponse<{ success: boolean }>> {
    return this.makeGraphRequest(`/${commentId}/likes`, {
      method: 'POST',
    })
  }

  async unlikeComment(commentId: string): Promise<IntegrationResponse<{ success: boolean }>> {
    return this.makeGraphRequest(`/${commentId}/likes`, {
      method: 'DELETE',
    })
  }

  // ============ Shopping & Commerce ============

  async getProductCollections(): Promise<IntegrationResponse<{ data: InstagramProductCollection[] }>> {
    return this.makeGraphRequest(`/${this.accountId}/product_collections?fields=id,title,description`)
  }

  async createProductCollection(params: {
    title: string
    description?: string
    product_ids: string[]
  }): Promise<IntegrationResponse<InstagramProductCollection>> {
    const formData = new URLSearchParams()
    formData.append('title', params.title)
    if (params.description) formData.append('description', params.description)
    formData.append('product_ids', params.product_ids.join(','))

    return this.makeGraphRequest(`/${this.accountId}/product_collections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    })
  }

  async updateProductCollection(collectionId: string, params: {
    title?: string
    description?: string
    product_ids?: string[]
  }): Promise<IntegrationResponse<{ success: boolean }>> {
    const formData = new URLSearchParams()
    if (params.title) formData.append('title', params.title)
    if (params.description) formData.append('description', params.description)
    if (params.product_ids) formData.append('product_ids', params.product_ids.join(','))

    return this.makeGraphRequest(`/${collectionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    })
  }

  async deleteProductCollection(collectionId: string): Promise<IntegrationResponse<{ success: boolean }>> {
    return this.makeGraphRequest(`/${collectionId}`, {
      method: 'DELETE',
    })
  }

  async getOrders(params?: {
    state?: 'created' | 'paid' | 'shipped' | 'completed' | 'refunded'
    limit?: number
  }): Promise<IntegrationResponse<{ data: InstagramOrder[] }>> {
    const query = new URLSearchParams()
    if (params?.state) query.set('state', params.state)
    if (params?.limit) query.set('limit', params.limit.toString())

    return this.makeGraphRequest(`/${this.accountId}/commerce_orders?${query}`)
  }

  async getOrder(orderId: string): Promise<IntegrationResponse<InstagramOrder>> {
    return this.makeGraphRequest(`/${orderId}?fields=id,order_status,created,updated,items,buyer_info`)
  }

  async updateOrderStatus(orderId: string, status: InstagramOrder['order_status']): Promise<IntegrationResponse<{ success: boolean }>> {
    const formData = new URLSearchParams()
    formData.append('order_status', status)

    return this.makeGraphRequest(`/${orderId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    })
  }

  // ============ Branded Content ============

  async tagBrandedContentSponsors(mediaId: string, sponsorIds: string[]): Promise<IntegrationResponse<{ success: boolean }>> {
    const formData = new URLSearchParams()
    formData.append('sponsor_tags', sponsorIds.join(','))

    return this.makeGraphRequest(`/${mediaId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    })
  }

  async getBrandedContentAds(): Promise<IntegrationResponse<{ data: any[] }>> {
    return this.makeGraphRequest(`/${this.accountId}/branded_content_ads`)
  }

  async approveBrandedContentTag(tagId: string): Promise<IntegrationResponse<{ success: boolean }>> {
    const formData = new URLSearchParams()
    formData.append('approved', 'true')

    return this.makeGraphRequest(`/${tagId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    })
  }

  // ============ Messaging Features ============

  async setIceBreakers(iceBreakers: InstagramIceBreaker[]): Promise<IntegrationResponse<{ success: boolean }>> {
    const formData = new URLSearchParams()
    formData.append('ice_breakers', JSON.stringify(iceBreakers))

    return this.makeGraphRequest(`/${this.accountId}/messenger_profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    })
  }

  async getIceBreakers(): Promise<IntegrationResponse<{ data: InstagramIceBreaker[] }>> {
    return this.makeGraphRequest(`/${this.accountId}/messenger_profile?fields=ice_breakers`)
  }

  async deleteIceBreakers(): Promise<IntegrationResponse<{ success: boolean }>> {
    return this.makeGraphRequest(`/${this.accountId}/messenger_profile`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: ['ice_breakers'] }),
    })
  }

  async setAwayMessage(awayMessage: InstagramAwayMessage): Promise<IntegrationResponse<{ success: boolean }>> {
    const formData = new URLSearchParams()
    formData.append('away_message', JSON.stringify(awayMessage))

    return this.makeGraphRequest(`/${this.accountId}/messenger_profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    })
  }

  async getAwayMessage(): Promise<IntegrationResponse<InstagramAwayMessage>> {
    return this.makeGraphRequest(`/${this.accountId}/messenger_profile?fields=away_message`)
  }

  async setPersistentMenu(menuItems: Array<{
    type: 'web_url' | 'postback'
    title: string
    url?: string
    payload?: string
  }>): Promise<IntegrationResponse<{ success: boolean }>> {
    const formData = new URLSearchParams()
    formData.append('persistent_menu', JSON.stringify([{
      locale: 'default',
      composer_input_disabled: false,
      call_to_actions: menuItems,
    }]))

    return this.makeGraphRequest(`/${this.accountId}/messenger_profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    })
  }

  async markMessageAsRead(messageId: string): Promise<IntegrationResponse<{ success: boolean }>> {
    return this.makeGraphRequest(`/${messageId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ read: true }),
    })
  }

  // ============ Advanced Analytics ============

  async getDetailedAudienceInsights(params: {
    since?: string
    until?: string
  }): Promise<IntegrationResponse<{ data: InstagramInsight[] }>> {
    const metrics = [
      'audience_city',
      'audience_country',
      'audience_gender_age',
      'audience_locale',
      'online_followers',
    ]

    const query = new URLSearchParams()
    query.set('metric', metrics.join(','))
    query.set('period', 'lifetime')
    if (params.since) query.set('since', params.since)
    if (params.until) query.set('until', params.until)

    return this.makeGraphRequest(`/${this.accountId}/insights?${query}`)
  }

  async getReachInsights(params: {
    since?: string
    until?: string
  }): Promise<IntegrationResponse<{ data: InstagramInsight[] }>> {
    const metrics = [
      'reach',
      'impressions',
      'accounts_engaged',
    ]

    const query = new URLSearchParams()
    query.set('metric', metrics.join(','))
    query.set('period', 'day')
    if (params.since) query.set('since', params.since)
    if (params.until) query.set('until', params.until)

    return this.makeGraphRequest(`/${this.accountId}/insights?${query}`)
  }

  async getContentInteractionInsights(params: {
    since?: string
    until?: string
  }): Promise<IntegrationResponse<{ data: InstagramInsight[] }>> {
    const metrics = [
      'profile_links_taps',
      'website_clicks',
      'email_contacts',
      'phone_call_clicks',
      'text_message_clicks',
      'get_directions_clicks',
    ]

    const query = new URLSearchParams()
    query.set('metric', metrics.join(','))
    query.set('period', 'day')
    if (params.since) query.set('since', params.since)
    if (params.until) query.set('until', params.until)

    return this.makeGraphRequest(`/${this.accountId}/insights?${query}`)
  }

  async getVideoInsights(videoId: string): Promise<IntegrationResponse<{ data: InstagramInsight[] }>> {
    const metrics = [
      'video_views',
      'reach',
      'engagement',
      'saved',
      'video_view_time',
      'clips_replays_count',
    ]

    return this.makeGraphRequest(`/${videoId}/insights?metric=${metrics.join(',')}`)
  }

  async getStoriesInsights(params: {
    since?: string
    until?: string
  }): Promise<IntegrationResponse<{ data: InstagramInsight[] }>> {
    const metrics = [
      'stories_impressions',
      'stories_reach',
      'stories_exits',
      'stories_replies',
      'stories_taps_forward',
      'stories_taps_back',
    ]

    const query = new URLSearchParams()
    query.set('metric', metrics.join(','))
    query.set('period', 'day')
    if (params.since) query.set('since', params.since)
    if (params.until) query.set('until', params.until)

    return this.makeGraphRequest(`/${this.accountId}/insights?${query}`)
  }

  // ============ User Interactions ============

  async likeMedia(mediaId: string): Promise<IntegrationResponse<{ success: boolean }>> {
    return this.makeGraphRequest(`/${mediaId}/likes`, {
      method: 'POST',
    })
  }

  async unlikeMedia(mediaId: string): Promise<IntegrationResponse<{ success: boolean }>> {
    return this.makeGraphRequest(`/${mediaId}/likes`, {
      method: 'DELETE',
    })
  }

  async saveMedia(mediaId: string): Promise<IntegrationResponse<{ success: boolean }>> {
    return this.makeGraphRequest(`/${mediaId}/saves`, {
      method: 'POST',
    })
  }

  async unsaveMedia(mediaId: string): Promise<IntegrationResponse<{ success: boolean }>> {
    return this.makeGraphRequest(`/${mediaId}/saves`, {
      method: 'DELETE',
    })
  }

  // ============ Advanced Media Operations ============

  async getCarouselChildren(carouselId: string): Promise<IntegrationResponse<{ data: InstagramMedia[] }>> {
    return this.makeGraphRequest(`/${carouselId}/children?fields=id,media_type,media_url,permalink,thumbnail_url`)
  }

  async getSavedMedia(): Promise<IntegrationResponse<{ data: InstagramMedia[] }>> {
    return this.makeGraphRequest(`/${this.accountId}/saved_media?fields=id,caption,media_type,media_url,permalink,timestamp`)
  }

  async getRecentlySearched(): Promise<IntegrationResponse<{ data: any[] }>> {
    return this.makeGraphRequest(`/${this.accountId}/recently_searched_hashtags`)
  }

  async getMediaProductTags(mediaId: string): Promise<IntegrationResponse<{ data: InstagramProductTag[] }>> {
    return this.makeGraphRequest(`/${mediaId}/product_tags`)
  }

  async deleteMediaProductTags(mediaId: string, productIds: string[]): Promise<IntegrationResponse<{ success: boolean }>> {
    const formData = new URLSearchParams()
    formData.append('deleted_product_ids', productIds.join(','))

    return this.makeGraphRequest(`/${mediaId}/product_tags`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    })
  }

  // ============ Content Discovery ============

  async searchLocation(params: {
    latitude: number
    longitude: number
    distance?: number
  }): Promise<IntegrationResponse<{ data: any[] }>> {
    const query = new URLSearchParams()
    query.set('latitude', params.latitude.toString())
    query.set('longitude', params.longitude.toString())
    if (params.distance) query.set('distance', params.distance.toString())

    return this.makeGraphRequest(`/pages/search?${query}&type=place`)
  }

  async getLocationMedia(locationId: string, params?: {
    limit?: number
  }): Promise<IntegrationResponse<{ data: InstagramMedia[] }>> {
    const query = new URLSearchParams()
    query.set('fields', 'id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count')
    if (params?.limit) query.set('limit', params.limit.toString())

    return this.makeGraphRequest(`/${locationId}/media?${query}`)
  }

  async getUserTaggedMedia(userId: string): Promise<IntegrationResponse<{ data: InstagramMedia[] }>> {
    return this.makeGraphRequest(`/${userId}/tags?fields=id,caption,media_type,media_url,permalink,timestamp`)
  }

  // ============ Relationship Management ============

  async blockUser(userId: string): Promise<IntegrationResponse<{ success: boolean }>> {
    const formData = new URLSearchParams()
    formData.append('block', 'true')

    return this.makeGraphRequest(`/${this.accountId}/blocked`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    })
  }

  async unblockUser(userId: string): Promise<IntegrationResponse<{ success: boolean }>> {
    return this.makeGraphRequest(`/${this.accountId}/blocked/${userId}`, {
      method: 'DELETE',
    })
  }

  async getBlockedUsers(): Promise<IntegrationResponse<{ data: InstagramUser[] }>> {
    return this.makeGraphRequest(`/${this.accountId}/blocked?fields=id,username,name`)
  }

  // ============ Content Publishing Limits ============

  async getPublishingLimit(): Promise<IntegrationResponse<{
    quota_usage: number
    config: {
      quota_total: number
      quota_duration: number
    }
  }>> {
    return this.makeGraphRequest(`/${this.accountId}/content_publishing_limit`)
  }

  // ============ Media Library ============

  async uploadMediaToLibrary(params: {
    file_url: string
    media_type: 'IMAGE' | 'VIDEO'
  }): Promise<IntegrationResponse<{ id: string }>> {
    const formData = new URLSearchParams()
    formData.append('file_url', params.file_url)
    formData.append('media_type', params.media_type)

    return this.makeGraphRequest(`/${this.accountId}/media_library`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    })
  }

  async getMediaLibrary(): Promise<IntegrationResponse<{ data: InstagramMedia[] }>> {
    return this.makeGraphRequest(`/${this.accountId}/media_library?fields=id,media_type,media_url,thumbnail_url,timestamp`)
  }
}
