/**
 * Twitter/X Adapter - Comprehensive API v2 Integration
 * Supports tweets, DMs, users, timelines, search, media, lists, spaces, and analytics
 */
import { BaseIntegrationAdapter } from '../base-adapter'
import { IntegrationConfig, IntegrationCapabilities, IntegrationResponse } from '../types'

// ============================================================================
// TWEET INTERFACES
// ============================================================================

export interface TwitterTweet {
  id?: string
  text: string
  attachments?: {
    media_keys?: string[]
    poll_ids?: string[]
  }
  geo?: {
    place_id?: string
  }
  media?: {
    media_ids?: string[]
    tagged_user_ids?: string[]
  }
  poll?: {
    options: string[]
    duration_minutes?: number
  }
  quote_tweet_id?: string
  reply?: {
    in_reply_to_tweet_id: string
    exclude_reply_user_ids?: string[]
  }
  reply_settings?: 'following' | 'mentionedUsers'
  direct_message_deep_link?: string
  for_super_followers_only?: boolean
  created_at?: string
  author_id?: string
  conversation_id?: string
  in_reply_to_user_id?: string
  referenced_tweets?: Array<{
    type: 'retweeted' | 'quoted' | 'replied_to'
    id: string
  }>
  lang?: string
  possibly_sensitive?: boolean
  reply_count?: number
  retweet_count?: number
  like_count?: number
  quote_count?: number
}

export interface TwitterCreateTweetRequest {
  text?: string
  media?: {
    media_ids?: string[]
    tagged_user_ids?: string[]
  }
  poll?: {
    options: string[]
    duration_minutes?: number
  }
  quote_tweet_id?: string
  reply?: {
    in_reply_to_tweet_id: string
    exclude_reply_user_ids?: string[]
  }
  reply_settings?: 'following' | 'mentionedUsers'
  direct_message_deep_link?: string
  for_super_followers_only?: boolean
}

export interface TwitterTweetExpansion {
  'tweet.fields'?: string
  'user.fields'?: string
  'media.fields'?: string
  'poll.fields'?: string
  'place.fields'?: string
  expansions?: string
  max_results?: number
  pagination_token?: string
}

// ============================================================================
// USER INTERFACES
// ============================================================================

export interface TwitterUser {
  id: string
  name: string
  username: string
  created_at?: string
  description?: string
  location?: string
  pinned_tweet_id?: string
  profile_image_url?: string
  protected?: boolean
  public_metrics?: {
    followers_count: number
    following_count: number
    tweet_count: number
    listed_count: number
  }
  url?: string
  verified?: boolean
  verified_type?: 'blue' | 'business' | 'government' | 'none'
  withheld?: {
    country_codes: string[]
    scope?: 'tweet' | 'user'
  }
}

export interface TwitterUserExpansion {
  'user.fields'?: string
  'tweet.fields'?: string
  expansions?: string
}

// ============================================================================
// DIRECT MESSAGE INTERFACES
// ============================================================================

export interface TwitterDirectMessage {
  id: string
  text?: string
  event_type: string
  created_at?: string
  sender_id?: string
  dm_conversation_id?: string
  referenced_tweets?: Array<{
    id: string
  }>
  attachments?: {
    media_keys?: string[]
  }
}

export interface TwitterDMEvent {
  event_type: 'MessageCreate' | 'ParticipantsJoin' | 'ParticipantsLeave'
  message_create?: {
    target: { recipient_id: string }
    message_data: {
      text: string
      attachment?: {
        type: 'media'
        media: { id: string }
      }
      quick_reply?: {
        type: 'options'
        options: Array<{
          label: string
          description?: string
          metadata?: string
        }>
      }
      ctas?: Array<{
        type: 'web_url'
        label: string
        url: string
      }>
    }
  }
}

export interface TwitterDMConversation {
  id: string
  messages?: TwitterDirectMessage[]
}

// ============================================================================
// SEARCH & TIMELINE INTERFACES
// ============================================================================

export interface TwitterSearchParams {
  query: string
  max_results?: number
  next_token?: string
  since_id?: string
  until_id?: string
  start_time?: string
  end_time?: string
  sort_order?: 'recency' | 'relevancy'
  'tweet.fields'?: string
  'user.fields'?: string
  expansions?: string
}

export interface TwitterTimelineParams {
  max_results?: number
  pagination_token?: string
  since_id?: string
  until_id?: string
  start_time?: string
  end_time?: string
  exclude?: string[]
  'tweet.fields'?: string
  'user.fields'?: string
  'media.fields'?: string
  expansions?: string
}

// ============================================================================
// MEDIA INTERFACES
// ============================================================================

export interface TwitterMediaUpload {
  media_id: string
  media_id_string: string
  size: number
  expires_after_secs: number
  image?: {
    image_type: string
    w: number
    h: number
  }
  video?: {
    video_type: string
  }
}

export interface TwitterMedia {
  media_key: string
  type: 'photo' | 'video' | 'animated_gif'
  url?: string
  duration_ms?: number
  height?: number
  width?: number
  preview_image_url?: string
  public_metrics?: {
    view_count?: number
  }
  alt_text?: string
}

// ============================================================================
// LIST INTERFACES
// ============================================================================

export interface TwitterList {
  id: string
  name: string
  description?: string
  private?: boolean
  owner_id?: string
  follower_count?: number
  member_count?: number
  created_at?: string
}

export interface TwitterCreateListRequest {
  name: string
  description?: string
  private?: boolean
}

// ============================================================================
// SPACE INTERFACES
// ============================================================================

export interface TwitterSpace {
  id: string
  state: 'live' | 'scheduled' | 'ended'
  created_at?: string
  started_at?: string
  ended_at?: string
  host_ids?: string[]
  lang?: string
  is_ticketed?: boolean
  invited_user_ids?: string[]
  participant_count?: number
  speaker_ids?: string[]
  scheduled_start?: string
  title?: string
  topic_ids?: string[]
  updated_at?: string
}

// ============================================================================
// METRICS & ANALYTICS INTERFACES
// ============================================================================

export interface TwitterTweetMetrics {
  impression_count?: number
  like_count?: number
  reply_count?: number
  retweet_count?: number
  quote_count?: number
  bookmark_count?: number
  url_link_clicks?: number
  user_profile_clicks?: number
}

export interface TwitterUserMetrics {
  followers_count: number
  following_count: number
  tweet_count: number
  listed_count: number
}

// ============================================================================
// WEBHOOK INTERFACES
// ============================================================================

export interface TwitterWebhookConfig {
  url: string
  env_name: string
}

export interface TwitterWebhookSubscription {
  webhook_id: string
  url: string
  valid: boolean
  created_timestamp: string
}

// ============================================================================
// MAIN ADAPTER CLASS
// ============================================================================

export class TwitterAdapter extends BaseIntegrationAdapter {
  private bearerToken?: string
  private apiKey?: string
  private apiSecret?: string
  private accessToken?: string
  private accessSecret?: string
  private baseUrl = 'https://api.twitter.com/2'
  private v1BaseUrl = 'https://api.twitter.com/1.1'
  private uploadUrl = 'https://upload.twitter.com/1.1'

  getCapabilities(): IntegrationCapabilities {
    return {
      canSendMessages: true,
      canReceiveMessages: true,
      canSendFiles: true,
      canSendImages: true,
      canSendVideo: true,
      canSendAudio: false,
      canSendLocation: false,
      canSendButtons: true,
      canSendCards: false,
      canSendCarousels: false,
      canSendQuickReplies: true,
      canSendTemplates: false,
      canScheduleMessages: false,
      canBroadcast: true,
      canTag: true,
      canAssign: false,
      canCreateTickets: false,
      canCreateLeads: true,
      canCreateContacts: true,
      canSyncContacts: true,
      canSyncConversations: true,
      canSyncTickets: false,
      canExportData: true,
      canImportData: false,
      canTrackEvents: true,
      canTrackMetrics: true,
      canGenerateReports: false,
      canCreateWorkflows: false,
      canTriggerActions: true,
      canListenToWebhooks: true,
      maxMessageLength: 10000,
      maxFileSize: 5 * 1024 * 1024,
      maxBatchSize: 50,
      rateLimit: { messages: 500, period: 'per_day' },
    }
  }

  async connect(): Promise<IntegrationResponse<void>> {
    this.bearerToken = this.config.credentials.bearerToken
    this.accessToken = this.config.credentials.accessToken
    this.apiKey = this.config.credentials.apiKey
    this.apiSecret = this.config.credentials.apiSecret
    this.accessSecret = this.config.credentials.accessSecret

    if (!this.bearerToken && !this.accessToken) {
      return {
        success: false,
        error: { code: 'AUTH_ERROR', message: 'Missing credentials', retryable: false }
      }
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
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/users/me`, {
          headers: { 'Authorization': `Bearer ${this.bearerToken || this.accessToken}` }
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return await response.json()
      })
      return { success: result.success, data: result.success }
    } catch (error: any) {
      return { success: false, data: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // TWEET MANAGEMENT METHODS
  // ============================================================================

  /**
   * Create a new tweet
   */
  async createTweet(tweet: TwitterCreateTweetRequest): Promise<IntegrationResponse<TwitterTweet>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tweets`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.bearerToken || this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(tweet)
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success
        ? { success: true, data: result.data.data }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  /**
   * Create a simple text tweet
   */
  async createSimpleTweet(text: string): Promise<IntegrationResponse<TwitterTweet>> {
    return this.createTweet({ text })
  }

  /**
   * Create a tweet with media
   */
  async createTweetWithMedia(text: string, mediaIds: string[]): Promise<IntegrationResponse<TwitterTweet>> {
    return this.createTweet({ text, media: { media_ids: mediaIds } })
  }

  /**
   * Create a quote tweet
   */
  async createQuoteTweet(text: string, quoteTweetId: string): Promise<IntegrationResponse<TwitterTweet>> {
    return this.createTweet({ text, quote_tweet_id: quoteTweetId })
  }

  /**
   * Reply to a tweet
   */
  async replyToTweet(text: string, inReplyToTweetId: string): Promise<IntegrationResponse<TwitterTweet>> {
    return this.createTweet({
      text,
      reply: { in_reply_to_tweet_id: inReplyToTweetId }
    })
  }

  /**
   * Create a tweet with a poll
   */
  async createTweetWithPoll(
    text: string,
    pollOptions: string[],
    durationMinutes?: number
  ): Promise<IntegrationResponse<TwitterTweet>> {
    return this.createTweet({
      text,
      poll: { options: pollOptions, duration_minutes: durationMinutes }
    })
  }

  /**
   * Delete a tweet
   */
  async deleteTweet(tweetId: string): Promise<IntegrationResponse<{ deleted: boolean }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tweets/${tweetId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${this.bearerToken || this.accessToken}` }
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success
        ? { success: true, data: result.data.data }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  /**
   * Get a tweet by ID
   */
  async getTweet(tweetId: string, params?: TwitterTweetExpansion): Promise<IntegrationResponse<TwitterTweet>> {
    try {
      await this.ensureConnected()
      const queryParams = new URLSearchParams(params as any).toString()
      const url = `${this.baseUrl}/tweets/${tweetId}${queryParams ? `?${queryParams}` : ''}`

      const result = await this.makeRequest(async () => {
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${this.bearerToken || this.accessToken}` }
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success
        ? { success: true, data: result.data.data }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  /**
   * Get multiple tweets by IDs
   */
  async getTweets(tweetIds: string[], params?: TwitterTweetExpansion): Promise<IntegrationResponse<{ data: TwitterTweet[] }>> {
    try {
      await this.ensureConnected()
      const queryParams = new URLSearchParams({
        ids: tweetIds.join(','),
        ...(params as any)
      }).toString()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tweets?${queryParams}`, {
          headers: { 'Authorization': `Bearer ${this.bearerToken || this.accessToken}` }
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success
        ? { success: true, data: result.data }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  /**
   * Retweet a tweet
   */
  async retweet(userId: string, tweetId: string): Promise<IntegrationResponse<{ retweeted: boolean }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/users/${userId}/retweets`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.bearerToken || this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ tweet_id: tweetId })
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success
        ? { success: true, data: result.data.data }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  /**
   * Unretweet a tweet
   */
  async unretweet(userId: string, sourceTweetId: string): Promise<IntegrationResponse<{ retweeted: boolean }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/users/${userId}/retweets/${sourceTweetId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${this.bearerToken || this.accessToken}` }
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success
        ? { success: true, data: result.data.data }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  /**
   * Like a tweet
   */
  async likeTweet(userId: string, tweetId: string): Promise<IntegrationResponse<{ liked: boolean }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/users/${userId}/likes`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.bearerToken || this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ tweet_id: tweetId })
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success
        ? { success: true, data: result.data.data }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  /**
   * Unlike a tweet
   */
  async unlikeTweet(userId: string, tweetId: string): Promise<IntegrationResponse<{ liked: boolean }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/users/${userId}/likes/${tweetId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${this.bearerToken || this.accessToken}` }
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success
        ? { success: true, data: result.data.data }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  /**
   * Hide a reply to a tweet
   */
  async hideReply(tweetId: string): Promise<IntegrationResponse<{ hidden: boolean }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tweets/${tweetId}/hidden`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.bearerToken || this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ hidden: true })
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success
        ? { success: true, data: result.data.data }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  /**
   * Unhide a reply to a tweet
   */
  async unhideReply(tweetId: string): Promise<IntegrationResponse<{ hidden: boolean }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tweets/${tweetId}/hidden`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.bearerToken || this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ hidden: false })
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success
        ? { success: true, data: result.data.data }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // TIMELINE METHODS
  // ============================================================================

  /**
   * Get user's home timeline (tweets from followed accounts)
   */
  async getHomeTimeline(userId: string, params?: TwitterTimelineParams): Promise<IntegrationResponse<{ data: TwitterTweet[]; meta?: any }>> {
    try {
      await this.ensureConnected()
      const queryParams = new URLSearchParams(params as any).toString()
      const url = `${this.baseUrl}/users/${userId}/timelines/reverse_chronological${queryParams ? `?${queryParams}` : ''}`

      const result = await this.makeRequest(async () => {
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${this.bearerToken || this.accessToken}` }
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success
        ? { success: true, data: result.data }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  /**
   * Get user's tweets
   */
  async getUserTweets(userId: string, params?: TwitterTimelineParams): Promise<IntegrationResponse<{ data: TwitterTweet[]; meta?: any }>> {
    try {
      await this.ensureConnected()
      const queryParams = new URLSearchParams(params as any).toString()
      const url = `${this.baseUrl}/users/${userId}/tweets${queryParams ? `?${queryParams}` : ''}`

      const result = await this.makeRequest(async () => {
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${this.bearerToken || this.accessToken}` }
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success
        ? { success: true, data: result.data }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  /**
   * Get user's mentions
   */
  async getUserMentions(userId: string, params?: TwitterTimelineParams): Promise<IntegrationResponse<{ data: TwitterTweet[]; meta?: any }>> {
    try {
      await this.ensureConnected()
      const queryParams = new URLSearchParams(params as any).toString()
      const url = `${this.baseUrl}/users/${userId}/mentions${queryParams ? `?${queryParams}` : ''}`

      const result = await this.makeRequest(async () => {
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${this.bearerToken || this.accessToken}` }
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success
        ? { success: true, data: result.data }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // USER MANAGEMENT METHODS
  // ============================================================================

  /**
   * Get user by ID
   */
  async getUser(userId: string, params?: TwitterUserExpansion): Promise<IntegrationResponse<TwitterUser>> {
    try {
      await this.ensureConnected()
      const queryParams = new URLSearchParams(params as any).toString()
      const url = `${this.baseUrl}/users/${userId}${queryParams ? `?${queryParams}` : ''}`

      const result = await this.makeRequest(async () => {
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${this.bearerToken || this.accessToken}` }
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success
        ? { success: true, data: result.data.data }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string, params?: TwitterUserExpansion): Promise<IntegrationResponse<TwitterUser>> {
    try {
      await this.ensureConnected()
      const queryParams = new URLSearchParams(params as any).toString()
      const url = `${this.baseUrl}/users/by/username/${username}${queryParams ? `?${queryParams}` : ''}`

      const result = await this.makeRequest(async () => {
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${this.bearerToken || this.accessToken}` }
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success
        ? { success: true, data: result.data.data }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  /**
   * Get multiple users by IDs
   */
  async getUsers(userIds: string[], params?: TwitterUserExpansion): Promise<IntegrationResponse<{ data: TwitterUser[] }>> {
    try {
      await this.ensureConnected()
      const queryParams = new URLSearchParams({
        ids: userIds.join(','),
        ...(params as any)
      }).toString()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/users?${queryParams}`, {
          headers: { 'Authorization': `Bearer ${this.bearerToken || this.accessToken}` }
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success
        ? { success: true, data: result.data }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  /**
   * Follow a user
   */
  async followUser(sourceUserId: string, targetUserId: string): Promise<IntegrationResponse<{ following: boolean }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/users/${sourceUserId}/following`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.bearerToken || this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ target_user_id: targetUserId })
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success
        ? { success: true, data: result.data.data }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(sourceUserId: string, targetUserId: string): Promise<IntegrationResponse<{ following: boolean }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/users/${sourceUserId}/following/${targetUserId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${this.bearerToken || this.accessToken}` }
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success
        ? { success: true, data: result.data.data }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  /**
   * Get user's followers
   */
  async getFollowers(userId: string, params?: { max_results?: number; pagination_token?: string }): Promise<IntegrationResponse<{ data: TwitterUser[]; meta?: any }>> {
    try {
      await this.ensureConnected()
      const queryParams = new URLSearchParams(params as any).toString()
      const url = `${this.baseUrl}/users/${userId}/followers${queryParams ? `?${queryParams}` : ''}`

      const result = await this.makeRequest(async () => {
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${this.bearerToken || this.accessToken}` }
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success
        ? { success: true, data: result.data }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  /**
   * Get user's following
   */
  async getFollowing(userId: string, params?: { max_results?: number; pagination_token?: string }): Promise<IntegrationResponse<{ data: TwitterUser[]; meta?: any }>> {
    try {
      await this.ensureConnected()
      const queryParams = new URLSearchParams(params as any).toString()
      const url = `${this.baseUrl}/users/${userId}/following${queryParams ? `?${queryParams}` : ''}`

      const result = await this.makeRequest(async () => {
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${this.bearerToken || this.accessToken}` }
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success
        ? { success: true, data: result.data }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  /**
   * Block a user
   */
  async blockUser(sourceUserId: string, targetUserId: string): Promise<IntegrationResponse<{ blocking: boolean }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/users/${sourceUserId}/blocking`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.bearerToken || this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ target_user_id: targetUserId })
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success
        ? { success: true, data: result.data.data }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  /**
   * Unblock a user
   */
  async unblockUser(sourceUserId: string, targetUserId: string): Promise<IntegrationResponse<{ blocking: boolean }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/users/${sourceUserId}/blocking/${targetUserId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${this.bearerToken || this.accessToken}` }
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success
        ? { success: true, data: result.data.data }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  /**
   * Mute a user
   */
  async muteUser(sourceUserId: string, targetUserId: string): Promise<IntegrationResponse<{ muting: boolean }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/users/${sourceUserId}/muting`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.bearerToken || this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ target_user_id: targetUserId })
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success
        ? { success: true, data: result.data.data }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  /**
   * Unmute a user
   */
  async unmuteUser(sourceUserId: string, targetUserId: string): Promise<IntegrationResponse<{ muting: boolean }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/users/${sourceUserId}/muting/${targetUserId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${this.bearerToken || this.accessToken}` }
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success
        ? { success: true, data: result.data.data }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // DIRECT MESSAGE METHODS
  // ============================================================================

  /**
   * Send a direct message
   */
  async sendDirectMessage(params: { recipientId: string; text: string; mediaId?: string }): Promise<IntegrationResponse<{ messageId: string }>> {
    try {
      await this.ensureConnected()
      const event: any = {
        event: {
          type: 'message_create',
          message_create: {
            target: { recipient_id: params.recipientId },
            message_data: { text: params.text }
          }
        }
      }

      if (params.mediaId) {
        event.event.message_create.message_data.attachment = {
          type: 'media',
          media: { id: params.mediaId }
        }
      }

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.v1BaseUrl}/direct_messages/events/new.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.bearerToken || this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(event),
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success
        ? { success: true, data: { messageId: result.data.event.id } }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  /**
   * Get direct message events
   */
  async getDirectMessages(params?: { count?: number; cursor?: string }): Promise<IntegrationResponse<{ events: TwitterDirectMessage[] }>> {
    try {
      await this.ensureConnected()
      const queryParams = new URLSearchParams(params as any).toString()
      const url = `${this.v1BaseUrl}/direct_messages/events/list.json${queryParams ? `?${queryParams}` : ''}`

      const result = await this.makeRequest(async () => {
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${this.bearerToken || this.accessToken}` }
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success
        ? { success: true, data: { events: result.data.events } }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  /**
   * Delete a direct message
   */
  async deleteDirectMessage(messageId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.v1BaseUrl}/direct_messages/events/destroy.json?id=${messageId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${this.bearerToken || this.accessToken}` }
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success
        ? { success: true, data: undefined }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // SEARCH METHODS
  // ============================================================================

  /**
   * Search recent tweets
   */
  async searchTweets(params: TwitterSearchParams): Promise<IntegrationResponse<{ data: TwitterTweet[]; meta?: any }>> {
    try {
      await this.ensureConnected()
      const queryParams = new URLSearchParams(params as any).toString()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tweets/search/recent?${queryParams}`, {
          headers: { 'Authorization': `Bearer ${this.bearerToken || this.accessToken}` }
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success
        ? { success: true, data: result.data }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  /**
   * Search all tweets (requires Academic Research access)
   */
  async searchAllTweets(params: TwitterSearchParams): Promise<IntegrationResponse<{ data: TwitterTweet[]; meta?: any }>> {
    try {
      await this.ensureConnected()
      const queryParams = new URLSearchParams(params as any).toString()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tweets/search/all?${queryParams}`, {
          headers: { 'Authorization': `Bearer ${this.bearerToken || this.accessToken}` }
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success
        ? { success: true, data: result.data }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // MEDIA UPLOAD METHODS
  // ============================================================================

  /**
   * Upload media (simple upload for images/GIFs)
   */
  async uploadMedia(media: Buffer | string, mediaType: string): Promise<IntegrationResponse<TwitterMediaUpload>> {
    try {
      await this.ensureConnected()
      const formData = new FormData()
      formData.append('media', media)
      formData.append('media_type', mediaType)

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.uploadUrl}/media/upload.json`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${this.bearerToken || this.accessToken}` },
          body: formData
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success
        ? { success: true, data: result.data }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  /**
   * Initialize chunked media upload (for large videos)
   */
  async initMediaUpload(totalBytes: number, mediaType: string): Promise<IntegrationResponse<{ media_id_string: string }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.uploadUrl}/media/upload.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.bearerToken || this.accessToken}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            command: 'INIT',
            total_bytes: totalBytes.toString(),
            media_type: mediaType
          })
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success
        ? { success: true, data: result.data }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  /**
   * Append chunk to media upload
   */
  async appendMediaChunk(mediaId: string, media: Buffer, segmentIndex: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const formData = new FormData()
      formData.append('command', 'APPEND')
      formData.append('media_id', mediaId)
      formData.append('media', media)
      formData.append('segment_index', segmentIndex.toString())

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.uploadUrl}/media/upload.json`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${this.bearerToken || this.accessToken}` },
          body: formData
        })
        if (!response.ok) throw new Error(await response.text())
        return response.status === 204 ? {} : await response.json()
      })
      return result.success
        ? { success: true, data: undefined }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  /**
   * Finalize media upload
   */
  async finalizeMediaUpload(mediaId: string): Promise<IntegrationResponse<TwitterMediaUpload>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.uploadUrl}/media/upload.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.bearerToken || this.accessToken}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            command: 'FINALIZE',
            media_id: mediaId
          })
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success
        ? { success: true, data: result.data }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // LIST MANAGEMENT METHODS
  // ============================================================================

  /**
   * Create a list
   */
  async createList(userId: string, list: TwitterCreateListRequest): Promise<IntegrationResponse<TwitterList>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/lists`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.bearerToken || this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(list)
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success
        ? { success: true, data: result.data.data }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  /**
   * Delete a list
   */
  async deleteList(listId: string): Promise<IntegrationResponse<{ deleted: boolean }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/lists/${listId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${this.bearerToken || this.accessToken}` }
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success
        ? { success: true, data: result.data.data }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  /**
   * Get a list by ID
   */
  async getList(listId: string): Promise<IntegrationResponse<TwitterList>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/lists/${listId}`, {
          headers: { 'Authorization': `Bearer ${this.bearerToken || this.accessToken}` }
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success
        ? { success: true, data: result.data.data }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  /**
   * Add a member to a list
   */
  async addListMember(listId: string, userId: string): Promise<IntegrationResponse<{ is_member: boolean }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/lists/${listId}/members`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.bearerToken || this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ user_id: userId })
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success
        ? { success: true, data: result.data.data }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  /**
   * Remove a member from a list
   */
  async removeListMember(listId: string, userId: string): Promise<IntegrationResponse<{ is_member: boolean }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/lists/${listId}/members/${userId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${this.bearerToken || this.accessToken}` }
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success
        ? { success: true, data: result.data.data }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  /**
   * Get list members
   */
  async getListMembers(listId: string, params?: { max_results?: number; pagination_token?: string }): Promise<IntegrationResponse<{ data: TwitterUser[] }>> {
    try {
      await this.ensureConnected()
      const queryParams = new URLSearchParams(params as any).toString()
      const url = `${this.baseUrl}/lists/${listId}/members${queryParams ? `?${queryParams}` : ''}`

      const result = await this.makeRequest(async () => {
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${this.bearerToken || this.accessToken}` }
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success
        ? { success: true, data: result.data }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  /**
   * Get list tweets
   */
  async getListTweets(listId: string, params?: TwitterTimelineParams): Promise<IntegrationResponse<{ data: TwitterTweet[] }>> {
    try {
      await this.ensureConnected()
      const queryParams = new URLSearchParams(params as any).toString()
      const url = `${this.baseUrl}/lists/${listId}/tweets${queryParams ? `?${queryParams}` : ''}`

      const result = await this.makeRequest(async () => {
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${this.bearerToken || this.accessToken}` }
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success
        ? { success: true, data: result.data }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // SPACES METHODS
  // ============================================================================

  /**
   * Get a Space by ID
   */
  async getSpace(spaceId: string): Promise<IntegrationResponse<TwitterSpace>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/spaces/${spaceId}`, {
          headers: { 'Authorization': `Bearer ${this.bearerToken || this.accessToken}` }
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success
        ? { success: true, data: result.data.data }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  /**
   * Search Spaces
   */
  async searchSpaces(query: string, params?: { state?: 'live' | 'scheduled'; max_results?: number }): Promise<IntegrationResponse<{ data: TwitterSpace[] }>> {
    try {
      await this.ensureConnected()
      const queryParams = new URLSearchParams({
        query,
        ...(params as any)
      }).toString()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/spaces/search?${queryParams}`, {
          headers: { 'Authorization': `Bearer ${this.bearerToken || this.accessToken}` }
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success
        ? { success: true, data: result.data }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // METRICS & ANALYTICS METHODS
  // ============================================================================

  /**
   * Get tweet metrics (non-public metrics require ownership)
   */
  async getTweetMetrics(tweetId: string): Promise<IntegrationResponse<TwitterTweetMetrics>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/tweets/${tweetId}?tweet.fields=public_metrics,non_public_metrics,organic_metrics`,
          {
            headers: { 'Authorization': `Bearer ${this.bearerToken || this.accessToken}` }
          }
        )
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })

      if (result.success) {
        const tweet = result.data.data
        return {
          success: true,
          data: {
            ...tweet.public_metrics,
            ...tweet.non_public_metrics,
            ...tweet.organic_metrics
          }
        }
      }
      return { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  /**
   * Get user metrics
   */
  async getUserMetrics(userId: string): Promise<IntegrationResponse<TwitterUserMetrics>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/users/${userId}?user.fields=public_metrics`, {
          headers: { 'Authorization': `Bearer ${this.bearerToken || this.accessToken}` }
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success
        ? { success: true, data: result.data.data.public_metrics }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }
}
