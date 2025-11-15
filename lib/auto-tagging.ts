/**
 * AI Auto-Tagging Service
 *
 * Automatically tags conversations based on content analysis.
 * Uses keyword-based classification but can be extended with AI APIs.
 */

export interface TagPrediction {
  tag: string
  confidence: number
  reason: string
}

// Tag keyword mappings
const tagPatterns = {
  'Support': {
    keywords: ['help', 'problem', 'issue', 'error', 'broken', 'not working', 'fix', 'support', 'assist', 'question'],
    weight: 1.0,
  },
  'Sales': {
    keywords: ['buy', 'purchase', 'price', 'pricing', 'cost', 'payment', 'plan', 'upgrade', 'demo', 'trial'],
    weight: 1.0,
  },
  'Feedback': {
    keywords: ['feedback', 'suggestion', 'recommend', 'improve', 'feature request', 'would be nice', 'wish'],
    weight: 0.9,
  },
  'Bug Report': {
    keywords: ['bug', 'crash', 'freeze', 'error message', 'doesn\'t work', 'broken feature', 'glitch'],
    weight: 1.0,
  },
  'Feature Request': {
    keywords: ['feature', 'add', 'new', 'would like', 'could you', 'suggestion', 'enhancement'],
    weight: 0.9,
  },
  'Question': {
    keywords: ['how', 'what', 'why', 'when', 'where', 'can i', 'is it possible', '?'],
    weight: 0.8,
  },
  'Complaint': {
    keywords: ['terrible', 'awful', 'disappointed', 'frustrated', 'angry', 'unacceptable', 'refund'],
    weight: 1.0,
  },
  'Positive': {
    keywords: ['great', 'excellent', 'love', 'amazing', 'wonderful', 'thank', 'perfect', 'awesome'],
    weight: 0.9,
  },
  'Resolved': {
    keywords: ['solved', 'fixed', 'working now', 'resolved', 'sorted', 'all set', 'problem solved'],
    weight: 1.0,
  },
  'Follow-up Needed': {
    keywords: ['will get back', 'let me check', 'need to investigate', 'follow up', 'checking on'],
    weight: 0.9,
  },
  'Billing': {
    keywords: ['invoice', 'billing', 'charge', 'subscription', 'payment method', 'credit card', 'refund'],
    weight: 1.0,
  },
  'Technical': {
    keywords: ['api', 'integration', 'code', 'technical', 'documentation', 'sdk', 'webhook'],
    weight: 0.9,
  },
  'Onboarding': {
    keywords: ['getting started', 'new user', 'first time', 'setup', 'how to start', 'beginner'],
    weight: 0.9,
  },
  'Cancellation': {
    keywords: ['cancel', 'unsubscribe', 'stop', 'discontinue', 'end subscription'],
    weight: 1.0,
  },
}

/**
 * Analyze conversation text and predict relevant tags
 */
export function predictTags(conversationText: string, threshold: number = 0.3): TagPrediction[] {
  const lowerText = conversationText.toLowerCase()
  const words = lowerText.split(/\s+/)
  const predictions: TagPrediction[] = []

  for (const [tag, pattern] of Object.entries(tagPatterns)) {
    let matchCount = 0
    const matchedKeywords: string[] = []

    for (const keyword of pattern.keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        matchCount++
        matchedKeywords.push(keyword)
      }
    }

    if (matchCount > 0) {
      // Calculate confidence based on match count and word density
      const density = matchCount / Math.max(words.length / 10, 1)
      const confidence = Math.min(density * pattern.weight, 1.0)

      if (confidence >= threshold) {
        predictions.push({
          tag,
          confidence: Math.round(confidence * 100) / 100,
          reason: `Matched keywords: ${matchedKeywords.slice(0, 3).join(', ')}${matchedKeywords.length > 3 ? '...' : ''}`,
        })
      }
    }
  }

  // Sort by confidence
  return predictions.sort((a, b) => b.confidence - a.confidence)
}

/**
 * Get top N predicted tags
 */
export function getTopTags(conversationText: string, topN: number = 3, threshold: number = 0.3): string[] {
  const predictions = predictTags(conversationText, threshold)
  return predictions.slice(0, topN).map(p => p.tag)
}

/**
 * Analyze message urgency
 */
export function analyzeUrgency(conversationText: string): 'high' | 'medium' | 'low' {
  const lowerText = conversationText.toLowerCase()

  const highUrgencyKeywords = [
    'urgent', 'asap', 'immediately', 'emergency', 'critical', 'broken', 'down',
    'not working', 'can\'t access', 'losing money', 'production'
  ]

  const mediumUrgencyKeywords = [
    'soon', 'quickly', 'important', 'need', 'issue', 'problem'
  ]

  for (const keyword of highUrgencyKeywords) {
    if (lowerText.includes(keyword)) {
      return 'high'
    }
  }

  for (const keyword of mediumUrgencyKeywords) {
    if (lowerText.includes(keyword)) {
      return 'medium'
    }
  }

  return 'low'
}

/**
 * Detect if conversation needs human escalation
 */
export function needsEscalation(conversationText: string, sentimentScore?: number): boolean {
  const lowerText = conversationText.toLowerCase()

  const escalationKeywords = [
    'speak to manager', 'talk to human', 'real person', 'agent',
    'this is ridiculous', 'unacceptable', 'lawsuit', 'legal action',
    'cancel my subscription', 'want a refund', 'terrible service'
  ]

  for (const keyword of escalationKeywords) {
    if (lowerText.includes(keyword)) {
      return true
    }
  }

  // Escalate if sentiment is very negative
  if (sentimentScore !== undefined && sentimentScore < 0.3) {
    return true
  }

  return false
}

/**
 * Extract intent from conversation
 */
export function extractIntent(conversationText: string): string {
  const lowerText = conversationText.toLowerCase()

  const intents = {
    'purchase': ['buy', 'purchase', 'get', 'want to order'],
    'cancel': ['cancel', 'stop', 'unsubscribe', 'end'],
    'refund': ['refund', 'money back', 'return'],
    'support': ['help', 'support', 'assist', 'problem'],
    'information': ['how', 'what', 'when', 'where', 'who', 'tell me about'],
    'complaint': ['complaint', 'complain', 'disappointed', 'frustrated'],
    'thank_you': ['thank', 'thanks', 'appreciate'],
  }

  for (const [intent, keywords] of Object.entries(intents)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        return intent
      }
    }
  }

  return 'general'
}

/**
 * Batch analyze conversations for tagging
 */
export function batchAnalyze(conversations: Array<{ id: string; text: string }>) {
  return conversations.map(conv => ({
    conversationId: conv.id,
    tags: getTopTags(conv.text),
    predictions: predictTags(conv.text),
    urgency: analyzeUrgency(conv.text),
    intent: extractIntent(conv.text),
    needsEscalation: needsEscalation(conv.text),
  }))
}

/**
 * Get tagging confidence level label
 */
export function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.7) return 'High'
  if (confidence >= 0.4) return 'Medium'
  return 'Low'
}

/**
 * Get urgency color for UI
 */
export function getUrgencyColor(urgency: 'high' | 'medium' | 'low'): string {
  switch (urgency) {
    case 'high':
      return 'text-red-600 bg-red-50 border-red-200'
    case 'medium':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    default:
      return 'text-green-600 bg-green-50 border-green-200'
  }
}
