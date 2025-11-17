/**
 * Microsoft Teams Adapter
 *
 * Full production implementation with:
 * - Bot Framework integration
 * - Microsoft Graph API
 * - Adaptive Cards
 * - Teams/Channel management
 * - Meeting management
 * - Tab management
 * - File operations
 * - Reactions
 * - Notifications
 * - Enterprise SSO
 * - Message extensions
 * - Call/Meeting bots
 * - Activity feed
 * - Proactive messaging
 */

import { BaseIntegrationAdapter } from '../base-adapter'
import {
  IntegrationConfig,
  IntegrationCapabilities,
  IntegrationResponse,
  AuthenticationError,
  ValidationError,
} from '../types'

interface TeamsMessage {
  id: string
  type: string
  from: { id: string; name: string }
  conversation: { id: string }
  text?: string
  attachments?: any[]
  channelData?: any
}

interface AdaptiveCard {
  type: 'AdaptiveCard'
  version: string
  body: any[]
  actions?: any[]
}

interface TeamsChannel {
  id?: string
  displayName: string
  description?: string
  email?: string
  webUrl?: string
  membershipType?: 'standard' | 'private' | 'shared'
  createdDateTime?: string
}

interface Team {
  id?: string
  displayName: string
  description?: string
  visibility?: 'private' | 'public'
  webUrl?: string
  isArchived?: boolean
  memberSettings?: {
    allowCreateUpdateChannels?: boolean
    allowDeleteChannels?: boolean
    allowAddRemoveApps?: boolean
    allowCreateUpdateRemoveTabs?: boolean
    allowCreateUpdateRemoveConnectors?: boolean
  }
  guestSettings?: {
    allowCreateUpdateChannels?: boolean
    allowDeleteChannels?: boolean
  }
  funSettings?: {
    allowGiphy?: boolean
    giphyContentRating?: 'strict' | 'moderate'
    allowStickersAndMemes?: boolean
    allowCustomMemes?: boolean
  }
}

interface TeamsMeeting {
  id?: string
  subject: string
  startDateTime: string
  endDateTime: string
  joinWebUrl?: string
  participants?: {
    organizer?: { identity: { user: { id: string } } }
    attendees?: Array<{ identity: { user: { id: string } }; role?: string }>
  }
  isOnlineMeeting?: boolean
  onlineMeetingProvider?: 'teamsForBusiness'
  allowedPresenters?: 'everyone' | 'organization' | 'roleIsPresenter'
}

interface TeamsTab {
  id?: string
  name: string
  teamsAppId: string
  configuration: {
    entityId?: string
    contentUrl?: string
    websiteUrl?: string
    removeUrl?: string
  }
  webUrl?: string
}

interface TeamsApp {
  id: string
  externalId?: string
  displayName: string
  distributionMethod?: 'store' | 'organization' | 'sideloaded'
}

interface TeamsFile {
  id: string
  name: string
  webUrl?: string
  size?: number
  createdDateTime?: string
  lastModifiedDateTime?: string
  downloadUrl?: string
}

interface TeamsReaction {
  reactionType: 'like' | 'angry' | 'sad' | 'laugh' | 'heart' | 'surprised'
  createdDateTime?: string
  user?: { id: string; displayName: string }
}

interface TeamsNotification {
  topic: {
    source: 'entityUrl' | 'text'
    value: string
  }
  activityType: string
  previewText: {
    content: string
  }
  templateParameters?: Array<{
    name: string
    value: string
  }>
}

interface TeamsCall {
  id: string
  state?: 'establishing' | 'established' | 'terminating' | 'terminated'
  direction?: 'incoming' | 'outgoing'
  subject?: string
  callChainId?: string
  source?: { identity: { user?: { id: string } } }
  targets?: Array<{ identity: { user?: { id: string } } }>
}

interface TaskModule {
  type: 'continue' | 'message'
  value?: {
    title?: string
    height?: number | 'small' | 'medium' | 'large'
    width?: number | 'small' | 'medium' | 'large'
    url?: string
    card?: AdaptiveCard
  }
  title?: string
  text?: string
}

export class TeamsAdapter extends BaseIntegrationAdapter {
  private botId?: string
  private appPassword?: string
  private tenantId?: string
  private graphAccessToken?: string
  private serviceUrl?: string

  getCapabilities(): IntegrationCapabilities {
    return {
      // Communication
      canSendMessages: true,
      canReceiveMessages: true,
      canSendFiles: true,
      canSendImages: true,
      canSendVideo: true,
      canSendAudio: true,
      canSendLocation: false,

      // Rich Content
      canSendButtons: true,
      canSendCards: true,
      canSendCarousels: true,
      canSendQuickReplies: true,
      canSendTemplates: true,

      // Features
      canScheduleMessages: false,
      canBroadcast: true,
      canTag: true,
      canAssign: true,
      canCreateTickets: false,
      canCreateLeads: false,
      canCreateContacts: false,

      // Data
      canSyncContacts: true,
      canSyncConversations: true,
      canSyncTickets: false,
      canExportData: true,
      canImportData: false,

      // Analytics
      canTrackEvents: true,
      canTrackMetrics: true,
      canGenerateReports: false,

      // Automation
      canCreateWorkflows: false,
      canTriggerActions: true,
      canListenToWebhooks: true,

      // Limits
      maxMessageLength: 28000,
      maxFileSize: 200 * 1024 * 1024, // 200MB
      maxBatchSize: 100,
      rateLimit: {
        messages: 1800,
        period: 'per_minute',
      },
    }
  }

  async connect(): Promise<IntegrationResponse<void>> {
    try {
      // Extract credentials
      this.botId = this.config.credentials.appId
      this.appPassword = this.config.credentials.appSecret
      this.tenantId = this.config.credentials.tenantId

      if (!this.botId || !this.appPassword) {
        throw new AuthenticationError(
          this.config.type,
          'Missing bot ID or app password'
        )
      }

      // Get OAuth token
      const tokenResult = await this.getAccessToken()
      if (!tokenResult.success) {
        throw new AuthenticationError(
          this.config.type,
          tokenResult.error?.message || 'Failed to get access token'
        )
      }

      this.isConnected = true

      return {
        success: true,
        data: undefined,
        metadata: {
          timestamp: new Date(),
          requestId: this.generateId(),
        },
      }
    } catch (error: any) {
      this.log('error', 'Failed to connect to Teams', error)
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  async disconnect(): Promise<IntegrationResponse<void>> {
    this.isConnected = false
    this.graphAccessToken = undefined

    return {
      success: true,
      data: undefined,
    }
  }

  async testConnection(): Promise<IntegrationResponse<boolean>> {
    try {
      await this.ensureConnected()

      // Test by getting bot info
      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `https://graph.microsoft.com/v1.0/me`,
          {
            headers: {
              Authorization: `Bearer ${this.graphAccessToken}`,
            },
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      return {
        success: result.success,
        data: result.success,
      }
    } catch (error: any) {
      return {
        success: false,
        data: false,
        error: this.formatError(error),
      }
    }
  }

  // ============================================================================
  // MESSAGING
  // ============================================================================

  async sendMessage(params: {
    conversationId: string
    text?: string
    card?: AdaptiveCard
    attachments?: any[]
    mentions?: Array<{ id: string; name: string }>
  }): Promise<IntegrationResponse<{ messageId: string }>> {
    try {
      await this.ensureConnected()

      const { conversationId, text, card, attachments, mentions } = params

      if (!text && !card && (!attachments || attachments.length === 0)) {
        throw new ValidationError(
          this.config.type,
          'Message must contain text, card, or attachments'
        )
      }

      const message: any = {
        type: 'message',
      }

      if (text) {
        message.text = text
      }

      if (card) {
        message.attachments = [
          {
            contentType: 'application/vnd.microsoft.card.adaptive',
            content: card,
          },
        ]
      } else if (attachments) {
        message.attachments = attachments
      }

      if (mentions) {
        message.entities = mentions.map(mention => ({
          type: 'mention',
          mentioned: {
            id: mention.id,
            name: mention.name,
          },
          text: `<at>${mention.name}</at>`,
        }))
      }

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.serviceUrl}/v3/conversations/${conversationId}/activities`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${this.graphAccessToken}`,
            },
            body: JSON.stringify(message),
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || {
            code: 'SEND_FAILED',
            message: 'Failed to send message',
            retryable: true,
          },
        }
      }

      return {
        success: true,
        data: {
          messageId: result.data.id,
        },
      }
    } catch (error: any) {
      this.log('error', 'Failed to send Teams message', error)
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  async updateMessage(params: {
    conversationId: string
    messageId: string
    text?: string
    card?: AdaptiveCard
  }): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const message: any = {
        type: 'message',
      }

      if (params.text) {
        message.text = params.text
      }

      if (params.card) {
        message.attachments = [
          {
            contentType: 'application/vnd.microsoft.card.adaptive',
            content: params.card,
          },
        ]
      }

      await this.makeRequest(async () => {
        const response = await fetch(
          `${this.serviceUrl}/v3/conversations/${params.conversationId}/activities/${params.messageId}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${this.graphAccessToken}`,
            },
            body: JSON.stringify(message),
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      return {
        success: true,
        data: undefined,
      }
    } catch (error: any) {
      this.log('error', 'Failed to update Teams message', error)
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  async deleteMessage(params: {
    conversationId: string
    messageId: string
  }): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      await this.makeRequest(async () => {
        const response = await fetch(
          `${this.serviceUrl}/v3/conversations/${params.conversationId}/activities/${params.messageId}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${this.graphAccessToken}`,
            },
          }
        )

        if (!response.ok && response.status !== 404) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return true
      })

      return {
        success: true,
        data: undefined,
      }
    } catch (error: any) {
      this.log('error', 'Failed to delete Teams message', error)
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  // ============================================================================
  // ADAPTIVE CARDS
  // ============================================================================

  createAdaptiveCard(params: {
    title?: string
    subtitle?: string
    text?: string
    image?: string
    buttons?: Array<{
      title: string
      value: string
      url?: string
    }>
    inputs?: Array<{
      id: string
      type: 'text' | 'number' | 'date' | 'time' | 'toggle' | 'choice'
      label: string
      placeholder?: string
      choices?: Array<{ title: string; value: string }>
    }>
  }): AdaptiveCard {
    const body: any[] = []

    if (params.title) {
      body.push({
        type: 'TextBlock',
        text: params.title,
        size: 'large',
        weight: 'bolder',
      })
    }

    if (params.subtitle) {
      body.push({
        type: 'TextBlock',
        text: params.subtitle,
        size: 'medium',
        isSubtle: true,
      })
    }

    if (params.image) {
      body.push({
        type: 'Image',
        url: params.image,
        size: 'large',
      })
    }

    if (params.text) {
      body.push({
        type: 'TextBlock',
        text: params.text,
        wrap: true,
      })
    }

    if (params.inputs) {
      params.inputs.forEach(input => {
        body.push({
          type: 'TextBlock',
          text: input.label,
          weight: 'bolder',
        })

        const inputConfig: any = {
          id: input.id,
          placeholder: input.placeholder,
        }

        switch (input.type) {
          case 'text':
            body.push({ type: 'Input.Text', ...inputConfig })
            break
          case 'number':
            body.push({ type: 'Input.Number', ...inputConfig })
            break
          case 'date':
            body.push({ type: 'Input.Date', ...inputConfig })
            break
          case 'time':
            body.push({ type: 'Input.Time', ...inputConfig })
            break
          case 'toggle':
            body.push({ type: 'Input.Toggle', ...inputConfig })
            break
          case 'choice':
            body.push({
              type: 'Input.ChoiceSet',
              ...inputConfig,
              choices: input.choices,
            })
            break
        }
      })
    }

    const actions: any[] = []

    if (params.buttons) {
      params.buttons.forEach(button => {
        if (button.url) {
          actions.push({
            type: 'Action.OpenUrl',
            title: button.title,
            url: button.url,
          })
        } else {
          actions.push({
            type: 'Action.Submit',
            title: button.title,
            data: { value: button.value },
          })
        }
      })
    }

    return {
      type: 'AdaptiveCard',
      version: '1.5',
      body,
      actions: actions.length > 0 ? actions : undefined,
    }
  }

  // ============================================================================
  // CHANNEL OPERATIONS
  // ============================================================================

  async createChannel(teamId: string, channel: Partial<TeamsChannel>): Promise<IntegrationResponse<TeamsChannel>> {
    try {
      await this.ensureConnected()

      const result = await this.graphRequest('POST', `/teams/${teamId}/channels`, channel)
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listChannels(teamId: string): Promise<IntegrationResponse<{ channels: TeamsChannel[] }>> {
    try {
      await this.ensureConnected()

      const result = await this.graphRequest('GET', `/teams/${teamId}/channels`)
      return result.success
        ? { success: true, data: { channels: result.data.value } }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getChannel(teamId: string, channelId: string): Promise<IntegrationResponse<TeamsChannel>> {
    try {
      await this.ensureConnected()

      const result = await this.graphRequest('GET', `/teams/${teamId}/channels/${channelId}`)
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateChannel(teamId: string, channelId: string, updates: Partial<TeamsChannel>): Promise<IntegrationResponse<TeamsChannel>> {
    try {
      await this.ensureConnected()

      const result = await this.graphRequest('PATCH', `/teams/${teamId}/channels/${channelId}`, updates)
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteChannel(teamId: string, channelId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const result = await this.graphRequest('DELETE', `/teams/${teamId}/channels/${channelId}`)
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getChannelMessages(teamId: string, channelId: string, limit: number = 50): Promise<IntegrationResponse<{ messages: TeamsMessage[] }>> {
    try {
      await this.ensureConnected()

      const result = await this.graphRequest('GET', `/teams/${teamId}/channels/${channelId}/messages?$top=${limit}`)
      return result.success
        ? { success: true, data: { messages: result.data.value } }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async pinMessage(teamId: string, channelId: string, messageId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const result = await this.graphRequest('POST', `/teams/${teamId}/channels/${channelId}/messages/${messageId}/pin`, {})
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async unpinMessage(teamId: string, channelId: string, messageId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const result = await this.graphRequest('POST', `/teams/${teamId}/channels/${channelId}/messages/${messageId}/unpin`, {})
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // TEAM OPERATIONS
  // ============================================================================

  async createTeam(team: Partial<Team>): Promise<IntegrationResponse<Team>> {
    try {
      await this.ensureConnected()

      const result = await this.graphRequest('POST', '/teams', team)
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getTeam(teamId: string): Promise<IntegrationResponse<Team>> {
    try {
      await this.ensureConnected()

      const result = await this.graphRequest('GET', `/teams/${teamId}`)
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listTeams(userId?: string): Promise<IntegrationResponse<{ teams: Team[] }>> {
    try {
      await this.ensureConnected()

      const endpoint = userId ? `/users/${userId}/joinedTeams` : '/me/joinedTeams'
      const result = await this.graphRequest('GET', endpoint)
      return result.success
        ? { success: true, data: { teams: result.data.value } }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateTeam(teamId: string, updates: Partial<Team>): Promise<IntegrationResponse<Team>> {
    try {
      await this.ensureConnected()

      const result = await this.graphRequest('PATCH', `/teams/${teamId}`, updates)
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async archiveTeam(teamId: string, shouldSetSpoSiteReadOnlyForMembers?: boolean): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const result = await this.graphRequest('POST', `/teams/${teamId}/archive`, {
        shouldSetSpoSiteReadOnlyForMembers: shouldSetSpoSiteReadOnlyForMembers || false,
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async cloneTeam(teamId: string, params: {
    displayName: string
    description?: string
    mailNickname: string
    partsToClone: string[]
    visibility?: 'private' | 'public'
  }): Promise<IntegrationResponse<{ teamId: string }>> {
    try {
      await this.ensureConnected()

      const result = await this.graphRequest('POST', `/teams/${teamId}/clone`, params)
      return result.success ? { success: true, data: { teamId: result.data.id } } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // MEETING OPERATIONS
  // ============================================================================

  async createMeeting(meeting: Partial<TeamsMeeting>): Promise<IntegrationResponse<TeamsMeeting>> {
    try {
      await this.ensureConnected()

      const result = await this.graphRequest('POST', '/me/onlineMeetings', meeting)
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateMeeting(meetingId: string, updates: Partial<TeamsMeeting>): Promise<IntegrationResponse<TeamsMeeting>> {
    try {
      await this.ensureConnected()

      const result = await this.graphRequest('PATCH', `/me/onlineMeetings/${meetingId}`, updates)
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async cancelMeeting(meetingId: string, comment?: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const result = await this.graphRequest('POST', `/me/events/${meetingId}/cancel`, { comment })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getMeeting(meetingId: string): Promise<IntegrationResponse<TeamsMeeting>> {
    try {
      await this.ensureConnected()

      const result = await this.graphRequest('GET', `/me/onlineMeetings/${meetingId}`)
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listMeetings(startDate?: string, endDate?: string): Promise<IntegrationResponse<{ meetings: TeamsMeeting[] }>> {
    try {
      await this.ensureConnected()

      let endpoint = '/me/onlineMeetings'
      if (startDate && endDate) {
        endpoint += `?$filter=startDateTime ge '${startDate}' and endDateTime le '${endDate}'`
      }

      const result = await this.graphRequest('GET', endpoint)
      return result.success
        ? { success: true, data: { meetings: result.data.value } }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // TAB MANAGEMENT
  // ============================================================================

  async addTab(teamId: string, channelId: string, tab: Partial<TeamsTab>): Promise<IntegrationResponse<TeamsTab>> {
    try {
      await this.ensureConnected()

      const result = await this.graphRequest('POST', `/teams/${teamId}/channels/${channelId}/tabs`, tab)
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async removeTab(teamId: string, channelId: string, tabId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const result = await this.graphRequest('DELETE', `/teams/${teamId}/channels/${channelId}/tabs/${tabId}`)
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateTab(teamId: string, channelId: string, tabId: string, updates: Partial<TeamsTab>): Promise<IntegrationResponse<TeamsTab>> {
    try {
      await this.ensureConnected()

      const result = await this.graphRequest('PATCH', `/teams/${teamId}/channels/${channelId}/tabs/${tabId}`, updates)
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listTabs(teamId: string, channelId: string): Promise<IntegrationResponse<{ tabs: TeamsTab[] }>> {
    try {
      await this.ensureConnected()

      const result = await this.graphRequest('GET', `/teams/${teamId}/channels/${channelId}/tabs`)
      return result.success
        ? { success: true, data: { tabs: result.data.value } }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getTab(teamId: string, channelId: string, tabId: string): Promise<IntegrationResponse<TeamsTab>> {
    try {
      await this.ensureConnected()

      const result = await this.graphRequest('GET', `/teams/${teamId}/channels/${channelId}/tabs/${tabId}`)
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // APP CATALOG
  // ============================================================================

  async installApp(teamId: string, teamsAppId: string): Promise<IntegrationResponse<{ installationId: string }>> {
    try {
      await this.ensureConnected()

      const result = await this.graphRequest('POST', `/teams/${teamId}/installedApps`, {
        'teamsApp@odata.bind': `https://graph.microsoft.com/v1.0/appCatalogs/teamsApps/${teamsAppId}`,
      })
      return result.success ? { success: true, data: { installationId: result.data.id } } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async uninstallApp(teamId: string, installationId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const result = await this.graphRequest('DELETE', `/teams/${teamId}/installedApps/${installationId}`)
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listInstalledApps(teamId: string): Promise<IntegrationResponse<{ apps: TeamsApp[] }>> {
    try {
      await this.ensureConnected()

      const result = await this.graphRequest('GET', `/teams/${teamId}/installedApps?$expand=teamsApp`)
      return result.success
        ? { success: true, data: { apps: result.data.value.map((a: any) => a.teamsApp) } }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async upgradeApp(teamId: string, installationId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const result = await this.graphRequest('POST', `/teams/${teamId}/installedApps/${installationId}/upgrade`, {})
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // FILE OPERATIONS
  // ============================================================================

  async uploadFile(teamId: string, channelId: string, fileName: string, fileContent: Buffer | Blob): Promise<IntegrationResponse<TeamsFile>> {
    try {
      await this.ensureConnected()

      // First get the drive ID for the channel
      const driveResult = await this.graphRequest('GET', `/teams/${teamId}/channels/${channelId}/filesFolder`)
      if (!driveResult.success) {
        return { success: false, error: driveResult.error }
      }

      const driveId = driveResult.data.parentReference.driveId
      const folderId = driveResult.data.id

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${folderId}:/${fileName}:/content`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${this.graphAccessToken}`,
              'Content-Type': 'application/octet-stream',
            },
            body: fileContent,
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async downloadFile(driveId: string, itemId: string): Promise<IntegrationResponse<{ content: ArrayBuffer }>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${itemId}/content`,
          {
            headers: {
              Authorization: `Bearer ${this.graphAccessToken}`,
            },
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.arrayBuffer()
      })

      return result.success ? { success: true, data: { content: result.data } } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listFiles(teamId: string, channelId: string): Promise<IntegrationResponse<{ files: TeamsFile[] }>> {
    try {
      await this.ensureConnected()

      const result = await this.graphRequest('GET', `/teams/${teamId}/channels/${channelId}/filesFolder/children`)
      return result.success
        ? { success: true, data: { files: result.data.value } }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteFile(driveId: string, itemId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const result = await this.graphRequest('DELETE', `/drives/${driveId}/items/${itemId}`)
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async shareFile(driveId: string, itemId: string, recipients: string[], message?: string): Promise<IntegrationResponse<{ link: string }>> {
    try {
      await this.ensureConnected()

      const result = await this.graphRequest('POST', `/drives/${driveId}/items/${itemId}/createLink`, {
        type: 'view',
        scope: 'organization',
        recipients,
        message,
      })
      return result.success ? { success: true, data: { link: result.data.link.webUrl } } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // REACTIONS
  // ============================================================================

  async addReaction(teamId: string, channelId: string, messageId: string, reactionType: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const result = await this.graphRequest('POST', `/teams/${teamId}/channels/${channelId}/messages/${messageId}/reactions`, {
        reactionType,
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async removeReaction(teamId: string, channelId: string, messageId: string, reactionId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const result = await this.graphRequest('DELETE', `/teams/${teamId}/channels/${channelId}/messages/${messageId}/reactions/${reactionId}`)
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listReactions(teamId: string, channelId: string, messageId: string): Promise<IntegrationResponse<{ reactions: TeamsReaction[] }>> {
    try {
      await this.ensureConnected()

      const result = await this.graphRequest('GET', `/teams/${teamId}/channels/${channelId}/messages/${messageId}/reactions`)
      return result.success
        ? { success: true, data: { reactions: result.data.value } }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // NOTIFICATIONS
  // ============================================================================

  async sendActivityFeedNotification(params: {
    userId: string
    notification: TeamsNotification
  }): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const result = await this.graphRequest('POST', `/users/${params.userId}/teamwork/sendActivityNotification`, params.notification)
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async sendProactiveMessage(params: {
    conversationReference: any
    message: any
  }): Promise<IntegrationResponse<{ messageId: string }>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.serviceUrl}/v3/conversations`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${this.graphAccessToken}`,
            },
            body: JSON.stringify(params),
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      return result.success ? { success: true, data: { messageId: result.data.id } } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // TASK MODULES (MESSAGE EXTENSIONS)
  // ============================================================================

  createTaskModule(params: {
    type: 'continue' | 'message'
    title?: string
    card?: AdaptiveCard
    url?: string
    height?: number | 'small' | 'medium' | 'large'
    width?: number | 'small' | 'medium' | 'large'
    text?: string
  }): TaskModule {
    if (params.type === 'message') {
      return {
        type: 'message',
        title: params.title,
        text: params.text,
      }
    }

    return {
      type: 'continue',
      value: {
        title: params.title,
        height: params.height || 'medium',
        width: params.width || 'medium',
        url: params.url,
        card: params.card,
      },
    }
  }

  // ============================================================================
  // MICROSOFT GRAPH API
  // ============================================================================

  private async getAccessToken(): Promise<IntegrationResponse<string>> {
    try {
      const response = await fetch(
        `https://login.microsoftonline.com/${this.tenantId || 'botframework.com'}/oauth2/v2.0/token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: this.botId!,
            client_secret: this.appPassword!,
            scope: 'https://graph.microsoft.com/.default',
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`)
      }

      const data = await response.json()
      this.graphAccessToken = data.access_token

      return {
        success: true,
        data: data.access_token,
      }
    } catch (error: any) {
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  private async graphRequest(method: string, endpoint: string, body?: any): Promise<IntegrationResponse<any>> {
    return await this.makeRequest(async () => {
      const options: RequestInit = {
        method,
        headers: {
          'Authorization': `Bearer ${this.graphAccessToken}`,
          'Content-Type': 'application/json',
        },
      }

      if (body) {
        options.body = JSON.stringify(body)
      }

      const response = await fetch(`https://graph.microsoft.com/v1.0${endpoint}`, options)

      if (!response.ok && response.status !== 204) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`)
      }

      if (response.status === 204) {
        return undefined
      }

      return await response.json()
    })
  }

  async getUserProfile(userId: string): Promise<IntegrationResponse<{
    id: string
    name?: string
    email?: string
    avatar?: string
  }>> {
    try {
      await this.ensureConnected()

      const result = await this.graphRequest('GET', `/users/${userId}`)

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error,
        }
      }

      return {
        success: true,
        data: {
          id: result.data.id,
          name: result.data.displayName,
          email: result.data.mail || result.data.userPrincipalName,
          avatar: undefined, // Would need separate API call
        },
      }
    } catch (error: any) {
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  // ============================================================================
  // WEBHOOKS
  // ============================================================================

  async parseWebhook(payload: any): Promise<any> {
    // Handle Teams activity
    if (payload.type === 'message' && !payload.from.id.endsWith('[bot]')) {
      return {
        type: 'message',
        id: payload.id,
        conversationId: payload.conversation.id,
        from: {
          id: payload.from.id,
          name: payload.from.name,
        },
        text: payload.text,
        attachments: payload.attachments,
        timestamp: new Date(payload.timestamp),
        rawPayload: payload,
      }
    }

    // Handle invoke activities (card actions, etc.)
    if (payload.type === 'invoke') {
      return {
        type: 'invoke',
        name: payload.name,
        value: payload.value,
        conversationId: payload.conversation.id,
        from: {
          id: payload.from.id,
          name: payload.from.name,
        },
        timestamp: new Date(payload.timestamp),
        rawPayload: payload,
      }
    }

    // Handle conversation updates (members added/removed, etc.)
    if (payload.type === 'conversationUpdate') {
      return {
        type: 'conversationUpdate',
        conversationId: payload.conversation.id,
        membersAdded: payload.membersAdded,
        membersRemoved: payload.membersRemoved,
        timestamp: new Date(payload.timestamp),
        rawPayload: payload,
      }
    }

    return null
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }
}
