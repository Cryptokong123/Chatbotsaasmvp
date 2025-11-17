/**
 * Chatbot Builder System
 *
 * Visual chatbot builder with:
 * - Flow designer
 * - NLU training
 * - Intent management
 * - Entity management
 * - Dialog management
 * - Multi-turn conversations
 * - Context tracking
 * - Slot filling
 * - Fallback handling
 */

export interface ChatbotDefinition {
  id: string
  name: string
  description?: string
  language: string
  intents: Intent[]
  entities: Entity[]
  flows: ConversationFlow[]
  settings: ChatbotSettings
}

export interface Intent {
  id: string
  name: string
  trainingPhrases: string[]
  responses: Response[]
  action?: string
  parameters?: Parameter[]
  context?: {
    input?: string[]
    output?: string[]
    lifespan?: number
  }
}

export interface Entity {
  id: string
  name: string
  type: 'system' | 'regexp' | 'list'
  values?: EntityValue[]
  regexp?: string
  automatedExpansion?: boolean
}

export interface EntityValue {
  value: string
  synonyms: string[]
}

export interface Parameter {
  name: string
  entity: string
  required: boolean
  prompts?: string[]
  defaultValue?: any
}

export interface Response {
  type: 'text' | 'card' | 'quick_reply' | 'custom'
  text?: string
  card?: Card
  quickReplies?: QuickReply[]
  custom?: any
}

export interface Card {
  title: string
  subtitle?: string
  imageUrl?: string
  buttons?: Button[]
}

export interface Button {
  text: string
  type: 'postback' | 'url' | 'phone'
  value: string
}

export interface QuickReply {
  text: string
  payload: string
}

export interface ConversationFlow {
  id: string
  name: string
  trigger: FlowTrigger
  nodes: FlowNode[]
  edges: FlowEdge[]
}

export interface FlowTrigger {
  type: 'intent' | 'event' | 'webhook'
  value: string
}

export interface FlowNode {
  id: string
  type: 'message' | 'question' | 'condition' | 'action' | 'api_call' | 'slot_fill' | 'end'
  data: any
  position: { x: number; y: number }
}

export interface FlowEdge {
  id: string
  source: string
  target: string
  condition?: string
}

export interface ChatbotSettings {
  fallbackIntent?: string
  fallbackResponses?: string[]
  confidenceThreshold?: number
  enableSpellcheck?: boolean
  enableSentiment?: boolean
  sessionTimeout?: number
  maxTurns?: number
}

export interface ChatSession {
  id: string
  userId: string
  botId: string
  context: Record<string, any>
  history: Message[]
  startedAt: Date
  lastActivity: Date
}

export interface Message {
  id: string
  text: string
  intent?: string
  entities?: Record<string, any>
  confidence?: number
  timestamp: Date
  from: 'user' | 'bot'
}

export class ChatbotEngine {
  private bots: Map<string, ChatbotDefinition> = new Map()
  private sessions: Map<string, ChatSession> = new Map()
  private nlu: NLUEngine = new NLUEngine()

  async createBot(definition: ChatbotDefinition): Promise<string> {
    this.bots.set(definition.id, definition)
    await this.nlu.train(definition.id, definition.intents, definition.entities)
    return definition.id
  }

  async processMessage(botId: string, userId: string, text: string): Promise<Response[]> {
    const bot = this.bots.get(botId)
    if (!bot) throw new Error('Bot not found')

    // Get or create session
    let session = this.sessions.get(`${botId}:${userId}`)
    if (!session) {
      session = {
        id: this.generateId(),
        userId,
        botId,
        context: {},
        history: [],
        startedAt: new Date(),
        lastActivity: new Date(),
      }
      this.sessions.set(`${botId}:${userId}`, session)
    }

    // Update session
    session.lastActivity = new Date()
    session.history.push({
      id: this.generateId(),
      text,
      timestamp: new Date(),
      from: 'user',
    })

    // Perform NLU
    const nluResult = await this.nlu.understand(botId, text, session.context)

    // Find matching intent
    const intent = bot.intents.find(i => i.name === nluResult.intent)
    if (!intent) {
      return bot.settings.fallbackResponses?.map(text => ({ type: 'text', text })) || [{ type: 'text', text: 'I didn\'t understand that.' }]
    }

    // Extract entities and fill slots
    session.context = { ...session.context, ...nluResult.entities }

    // Check if all required parameters are filled
    const missingParams = intent.parameters?.filter(p => p.required && !session.context[p.name]) || []
    if (missingParams.length > 0) {
      const param = missingParams[0]
      return param.prompts?.map(text => ({ type: 'text', text })) || [{ type: 'text', text: `Please provide ${param.name}` }]
    }

    // Execute action if specified
    if (intent.action) {
      await this.executeAction(intent.action, session.context)
    }

    // Return responses
    const responses = intent.responses.map(r => this.processResponse(r, session.context))

    // Store bot responses in history
    responses.forEach(r => {
      if (r.text) {
        session.history.push({
          id: this.generateId(),
          text: r.text,
          intent: intent.name,
          timestamp: new Date(),
          from: 'bot',
        })
      }
    })

    return responses
  }

  private processResponse(response: Response, context: Record<string, any>): Response {
    if (response.type === 'text' && response.text) {
      // Replace variables
      const text = response.text.replace(/\{(\w+)\}/g, (_, key) => context[key] || '')
      return { ...response, text }
    }
    return response
  }

  private async executeAction(action: string, context: Record<string, any>): Promise<void> {
    // Execute custom actions (API calls, database updates, etc.)
    console.log(`Executing action: ${action}`, context)
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }

  getSession(botId: string, userId: string): ChatSession | undefined {
    return this.sessions.get(`${botId}:${userId}`)
  }

  endSession(botId: string, userId: string): void {
    this.sessions.delete(`${botId}:${userId}`)
  }
}

/**
 * NLU Engine for intent classification and entity extraction
 */
class NLUEngine {
  private models: Map<string, any> = new Map()

  async train(botId: string, intents: Intent[], entities: Entity[]): Promise<void> {
    // Train NLU model with intents and entities
    // In production, this would use actual ML models
    this.models.set(botId, { intents, entities })
  }

  async understand(botId: string, text: string, context: Record<string, any>): Promise<{
    intent: string
    confidence: number
    entities: Record<string, any>
  }> {
    const model = this.models.get(botId)
    if (!model) throw new Error('Model not found')

    const normalized = text.toLowerCase().trim()

    // Simple intent matching (in production, use ML model)
    let bestIntent = 'fallback'
    let bestScore = 0

    for (const intent of model.intents) {
      for (const phrase of intent.trainingPhrases) {
        const score = this.calculateSimilarity(normalized, phrase.toLowerCase())
        if (score > bestScore) {
          bestScore = score
          bestIntent = intent.name
        }
      }
    }

    // Extract entities
    const entities: Record<string, any> = {}
    for (const entity of model.entities) {
      if (entity.type === 'regexp' && entity.regexp) {
        const matches = text.match(new RegExp(entity.regexp, 'gi'))
        if (matches) entities[entity.name] = matches[0]
      }
      if (entity.type === 'list' && entity.values) {
        for (const value of entity.values) {
          if (normalized.includes(value.value.toLowerCase())) {
            entities[entity.name] = value.value
            break
          }
          for (const synonym of value.synonyms) {
            if (normalized.includes(synonym.toLowerCase())) {
              entities[entity.name] = value.value
              break
            }
          }
        }
      }
    }

    return {
      intent: bestIntent,
      confidence: bestScore,
      entities,
    }
  }

  private calculateSimilarity(a: string, b: string): number {
    if (a === b) return 1
    if (a.includes(b) || b.includes(a)) return 0.8

    // Simple word overlap
    const wordsA = new Set(a.split(' '))
    const wordsB = new Set(b.split(' '))
    const intersection = new Set([...wordsA].filter(x => wordsB.has(x)))

    return intersection.size / Math.max(wordsA.size, wordsB.size)
  }
}
