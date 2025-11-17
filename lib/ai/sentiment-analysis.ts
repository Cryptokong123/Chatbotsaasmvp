/**
 * Sentiment Analysis Engine
 *
 * Analyzes text for:
 * - Sentiment (positive/negative/neutral/mixed)
 * - Emotion detection (joy, sadness, anger, fear, surprise)
 * - Urgency detection
 * - Intent classification
 * - Entity extraction
 * - Topic modeling
 */

export interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed'
  score: number // -1 to 1
  confidence: number // 0 to 1
  emotions?: {
    joy?: number
    sadness?: number
    anger?: number
    fear?: number
    surprise?: number
    disgust?: number
  }
  urgency?: {
    level: 'low' | 'medium' | 'high' | 'critical'
    score: number
  }
  keywords?: string[]
  entities?: Entity[]
}

export interface Entity {
  text: string
  type: 'person' | 'organization' | 'location' | 'product' | 'date' | 'time' | 'money' | 'phone' | 'email' | 'url'
  confidence: number
}

export interface IntentResult {
  intent: string
  confidence: number
  entities: Entity[]
}

export class SentimentAnalysisEngine {
  private providers: Map<string, SentimentProvider> = new Map()
  private defaultProvider = 'builtin'

  constructor() {
    this.initializeProviders()
  }

  private initializeProviders() {
    // Initialize built-in sentiment analyzer
    this.providers.set('builtin', new BuiltInSentimentAnalyzer())
  }

  async analyzeSentiment(text: string, options?: { provider?: string; language?: string }): Promise<SentimentResult> {
    const provider = this.providers.get(options?.provider || this.defaultProvider)
    if (!provider) throw new Error('Provider not found')

    return await provider.analyze(text, options?.language)
  }

  async classifyIntent(text: string, possibleIntents?: string[]): Promise<IntentResult> {
    // Use NLU to classify intent
    const normalized = text.toLowerCase().trim()

    // Common intents
    const intents: Record<string, RegExp[]> = {
      'greeting': [/^(hi|hello|hey|good morning|good afternoon)/i],
      'farewell': [/^(bye|goodbye|see you|talk later)/i],
      'help': [/(help|assist|support|question)/i],
      'complaint': [/(problem|issue|wrong|broken|not working|frustrated|angry)/i],
      'praise': [/(thank|thanks|great|excellent|love|amazing|perfect)/i],
      'question': [/\?$/, /(what|how|why|when|where|who|which)/i],
      'order_status': [/(order|tracking|shipment|delivery)/i],
      'refund': [/(refund|return|money back)/i],
      'cancel': [/(cancel|stop|unsubscribe)/i],
      'purchase': [/(buy|purchase|order|checkout)/i],
    }

    for (const [intent, patterns] of Object.entries(intents)) {
      for (const pattern of patterns) {
        if (pattern.test(normalized)) {
          return {
            intent,
            confidence: 0.85,
            entities: await this.extractEntities(text),
          }
        }
      }
    }

    return { intent: 'unknown', confidence: 0.3, entities: [] }
  }

  async extractEntities(text: string): Promise<Entity[]> {
    const entities: Entity[] = []

    // Email extraction
    const emails = text.match(/[\w.-]+@[\w.-]+\.\w+/g) || []
    emails.forEach(email => entities.push({ text: email, type: 'email', confidence: 0.99 }))

    // Phone extraction
    const phones = text.match(/(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g) || []
    phones.forEach(phone => entities.push({ text: phone, type: 'phone', confidence: 0.95 }))

    // URL extraction
    const urls = text.match(/https?:\/\/[^\s]+/g) || []
    urls.forEach(url => entities.push({ text: url, type: 'url', confidence: 0.99 }))

    // Money extraction
    const money = text.match(/\$\d+(\.\d{2})?|\d+\s?(USD|EUR|GBP|JPY|CNY)/gi) || []
    money.forEach(amount => entities.push({ text: amount, type: 'money', confidence: 0.9 }))

    // Date extraction (simple patterns)
    const dates = text.match(/\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}/g) || []
    dates.forEach(date => entities.push({ text: date, type: 'date', confidence: 0.85 }))

    return entities
  }

  async detectUrgency(text: string): Promise<{ level: 'low' | 'medium' | 'high' | 'critical'; score: number }> {
    const urgentWords = ['urgent', 'asap', 'emergency', 'critical', 'immediately', 'now', 'right away', 'help', 'stuck']
    const highPriorityWords = ['important', 'priority', 'need', 'must', 'require']

    const normalized = text.toLowerCase()

    const urgentCount = urgentWords.filter(word => normalized.includes(word)).length
    const highPriorityCount = highPriorityWords.filter(word => normalized.includes(word)).length

    const hasExclamation = (text.match(/!/g) || []).length
    const hasAllCaps = text === text.toUpperCase() && text.length > 10

    let score = 0
    score += urgentCount * 0.3
    score += highPriorityCount * 0.15
    score += hasExclamation * 0.1
    score += hasAllCaps ? 0.2 : 0

    score = Math.min(score, 1)

    if (score > 0.7) return { level: 'critical', score }
    if (score > 0.5) return { level: 'high', score }
    if (score > 0.3) return { level: 'medium', score }
    return { level: 'low', score }
  }

  addProvider(name: string, provider: SentimentProvider) {
    this.providers.set(name, provider)
  }
}

export interface SentimentProvider {
  analyze(text: string, language?: string): Promise<SentimentResult>
}

/**
 * Built-in Sentiment Analyzer (Lexicon-based)
 */
class BuiltInSentimentAnalyzer implements SentimentProvider {
  private positiveWords = new Set([
    'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'perfect',
    'happy', 'pleased', 'satisfied', 'thank', 'thanks', 'appreciate', 'awesome', 'best',
    'brilliant', 'outstanding', 'superb', 'fabulous', 'terrific', 'beautiful', 'nice',
  ])

  private negativeWords = new Set([
    'bad', 'terrible', 'horrible', 'awful', 'poor', 'worst', 'hate', 'disappointed',
    'frustrat', 'angry', 'upset', 'annoyed', 'problem', 'issue', 'broken', 'wrong',
    'fail', 'error', 'sucks', 'useless', 'worthless', 'disgusting', 'pathetic',
  ])

  private intensifiers = new Set(['very', 'extremely', 'really', 'so', 'too', 'absolutely'])
  private negations = new Set(['not', 'no', 'never', 'neither', 'nobody', 'nothing', 'nowhere'])

  async analyze(text: string, language: string = 'en'): Promise<SentimentResult> {
    const words = text.toLowerCase().match(/\b\w+\b/g) || []

    let positiveScore = 0
    let negativeScore = 0
    let negated = false
    let intensified = false

    for (let i = 0; i < words.length; i++) {
      const word = words[i]

      // Check for negations
      if (this.negations.has(word)) {
        negated = true
        continue
      }

      // Check for intensifiers
      if (this.intensifiers.has(word)) {
        intensified = true
        continue
      }

      // Score sentiment words
      const multiplier = (intensified ? 1.5 : 1) * (negated ? -1 : 1)

      if (this.positiveWords.has(word)) {
        positiveScore += 1 * multiplier
      }

      if (this.negativeWords.has(word)) {
        negativeScore += 1 * Math.abs(multiplier)
      }

      // Reset modifiers
      if (this.positiveWords.has(word) || this.negativeWords.has(word)) {
        negated = false
        intensified = false
      }
    }

    // Calculate final scores
    const total = positiveScore + negativeScore
    const score = total === 0 ? 0 : (positiveScore - negativeScore) / total

    let sentiment: 'positive' | 'negative' | 'neutral' | 'mixed'
    if (Math.abs(score) < 0.1) sentiment = 'neutral'
    else if (positiveScore > 0 && negativeScore > 0 && Math.abs(score) < 0.3) sentiment = 'mixed'
    else if (score > 0) sentiment = 'positive'
    else sentiment = 'negative'

    const confidence = Math.min(Math.abs(score) + 0.3, 1)

    return {
      sentiment,
      score,
      confidence,
      emotions: this.analyzeEmotions(text),
    }
  }

  private analyzeEmotions(text: string): SentimentResult['emotions'] {
    const normalized = text.toLowerCase()

    const emotionPatterns = {
      joy: ['happy', 'joy', 'excited', 'love', 'wonderful', 'great', 'amazing'],
      sadness: ['sad', 'unhappy', 'depressed', 'disappointed', 'sorrow'],
      anger: ['angry', 'mad', 'furious', 'outrage', 'irritated', 'frustrated'],
      fear: ['afraid', 'scared', 'worried', 'anxious', 'nervous', 'terrified'],
      surprise: ['surprised', 'shocked', 'amazed', 'astonished', 'wow'],
      disgust: ['disgusting', 'gross', 'awful', 'terrible', 'horrible'],
    }

    const emotions: Record<string, number> = {}

    for (const [emotion, patterns] of Object.entries(emotionPatterns)) {
      const count = patterns.filter(pattern => normalized.includes(pattern)).length
      if (count > 0) {
        emotions[emotion] = Math.min(count * 0.3, 1)
      }
    }

    return emotions as SentimentResult['emotions']
  }
}

/**
 * AWS Comprehend Provider
 */
export class AWSComprehendProvider implements SentimentProvider {
  private accessKeyId: string
  private secretAccessKey: string
  private region: string

  constructor(accessKeyId: string, secretAccessKey: string, region: string = 'us-east-1') {
    this.accessKeyId = accessKeyId
    this.secretAccessKey = secretAccessKey
    this.region = region
  }

  async analyze(text: string, language: string = 'en'): Promise<SentimentResult> {
    // AWS Comprehend API call would go here
    // This is a placeholder showing the structure
    throw new Error('AWS Comprehend implementation pending')
  }
}

/**
 * Google Cloud Natural Language Provider
 */
export class GoogleNLProvider implements SentimentProvider {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async analyze(text: string, language: string = 'en'): Promise<SentimentResult> {
    const response = await fetch(`https://language.googleapis.com/v1/documents:analyzeSentiment?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document: { type: 'PLAIN_TEXT', content: text, language },
        encodingType: 'UTF8',
      }),
    })

    const data = await response.json()
    const sentimentData = data.documentSentiment

    let sentiment: 'positive' | 'negative' | 'neutral' | 'mixed'
    if (sentimentData.score > 0.25) sentiment = 'positive'
    else if (sentimentData.score < -0.25) sentiment = 'negative'
    else sentiment = 'neutral'

    return {
      sentiment,
      score: sentimentData.score,
      confidence: sentimentData.magnitude / 10, // Normalize magnitude to 0-1
    }
  }
}
