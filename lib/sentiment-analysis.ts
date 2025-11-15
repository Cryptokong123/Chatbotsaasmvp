/**
 * Sentiment Analysis Service
 *
 * This service provides sentiment analysis for messages and conversations.
 * It uses a simple keyword-based approach but can be easily extended to use
 * AI-based sentiment analysis APIs like OpenAI, AWS Comprehend, or Google NLP.
 */

interface SentimentResult {
  score: number // 0 to 1 (0 = very negative, 0.5 = neutral, 1 = very positive)
  label: 'positive' | 'neutral' | 'negative' | 'mixed'
  emotions: {
    joy?: number
    sadness?: number
    anger?: number
    fear?: number
    surprise?: number
    love?: number
    excitement?: number
    frustration?: number
  }
  confidence: number
}

// Keyword dictionaries for basic sentiment analysis
const positiveKeywords = [
  'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome',
  'love', 'happy', 'pleased', 'satisfied', 'perfect', 'thank', 'thanks',
  'helpful', 'appreciate', 'brilliant', 'outstanding', 'superb', 'delighted',
  'yes', 'definitely', 'absolutely', 'works', 'solved', 'fixed', 'helpful'
]

const negativeKeywords = [
  'bad', 'terrible', 'awful', 'horrible', 'poor', 'worst', 'hate', 'angry',
  'frustrated', 'disappointed', 'useless', 'broken', 'problem', 'issue',
  'error', 'fail', 'failed', 'wrong', 'not working', 'doesn\'t work', 'unhappy',
  'annoyed', 'upset', 'complaint', 'refund', 'cancel', 'unsubscribe'
]

const joyKeywords = ['happy', 'joy', 'delighted', 'excited', 'thrilled', 'wonderful', 'amazing']
const sadnessKeywords = ['sad', 'unhappy', 'disappointed', 'upset', 'depressed', 'down']
const angerKeywords = ['angry', 'furious', 'mad', 'frustrated', 'annoyed', 'irritated']
const fearKeywords = ['afraid', 'scared', 'worried', 'anxious', 'concerned', 'nervous']
const surpriseKeywords = ['surprised', 'unexpected', 'shocking', 'wow', 'amazing', 'incredible']
const loveKeywords = ['love', 'adore', 'cherish', 'appreciate', 'grateful', 'thank']

/**
 * Analyze sentiment of a text message
 *
 * This is a simple keyword-based implementation. For production use,
 * consider integrating with:
 * - OpenAI API for advanced sentiment analysis
 * - AWS Comprehend
 * - Google Cloud Natural Language API
 * - Azure Text Analytics
 */
export function analyzeSentiment(text: string): SentimentResult {
  const lowerText = text.toLowerCase()
  const words = lowerText.split(/\s+/)

  // Count positive and negative keywords
  let positiveCount = 0
  let negativeCount = 0

  for (const word of words) {
    if (positiveKeywords.some(keyword => word.includes(keyword))) {
      positiveCount++
    }
    if (negativeKeywords.some(keyword => word.includes(keyword))) {
      negativeCount++
    }
  }

  // Detect emotions
  const emotions: SentimentResult['emotions'] = {}

  const joyCount = words.filter(word => joyKeywords.some(kw => word.includes(kw))).length
  const sadnessCount = words.filter(word => sadnessKeywords.some(kw => word.includes(kw))).length
  const angerCount = words.filter(word => angerKeywords.some(kw => word.includes(kw))).length
  const fearCount = words.filter(word => fearKeywords.some(kw => word.includes(kw))).length
  const surpriseCount = words.filter(word => surpriseKeywords.some(kw => word.includes(kw))).length
  const loveCount = words.filter(word => loveKeywords.some(kw => word.includes(kw))).length

  if (joyCount > 0) emotions.joy = Math.min(joyCount / words.length * 10, 1)
  if (sadnessCount > 0) emotions.sadness = Math.min(sadnessCount / words.length * 10, 1)
  if (angerCount > 0) emotions.anger = Math.min(angerCount / words.length * 10, 1)
  if (fearCount > 0) emotions.fear = Math.min(fearCount / words.length * 10, 1)
  if (surpriseCount > 0) emotions.surprise = Math.min(surpriseCount / words.length * 10, 1)
  if (loveCount > 0) emotions.love = Math.min(loveCount / words.length * 10, 1)

  // Calculate sentiment score (0 to 1)
  const totalKeywords = positiveCount + negativeCount
  let score = 0.5 // Default neutral

  if (totalKeywords > 0) {
    score = positiveCount / totalKeywords
  }

  // Adjust for exclamation marks (usually indicates stronger emotion)
  const exclamationCount = (text.match(/!/g) || []).length
  if (exclamationCount > 0) {
    if (score > 0.5) {
      score = Math.min(score + 0.1, 1)
    } else if (score < 0.5) {
      score = Math.max(score - 0.1, 0)
    }
  }

  // Determine label
  let label: SentimentResult['label'] = 'neutral'
  if (score >= 0.65) {
    label = 'positive'
  } else if (score <= 0.35) {
    label = 'negative'
  } else if (positiveCount > 0 && negativeCount > 0 && Math.abs(positiveCount - negativeCount) <= 1) {
    label = 'mixed'
  }

  // Calculate confidence based on number of sentiment keywords found
  const confidence = Math.min(totalKeywords / (words.length * 0.3), 1)

  return {
    score: Math.round(score * 100) / 100,
    label,
    emotions,
    confidence: Math.round(confidence * 100) / 100,
  }
}

/**
 * Analyze sentiment for a batch of messages
 */
export function analyzeBatchSentiment(messages: string[]): SentimentResult[] {
  return messages.map(message => analyzeSentiment(message))
}

/**
 * Get overall conversation sentiment from individual message sentiments
 */
export function getConversationSentiment(messageSentiments: SentimentResult[]): SentimentResult {
  if (messageSentiments.length === 0) {
    return {
      score: 0.5,
      label: 'neutral',
      emotions: {},
      confidence: 0,
    }
  }

  // Calculate average score
  const avgScore = messageSentiments.reduce((sum, s) => sum + s.score, 0) / messageSentiments.length

  // Aggregate emotions
  const emotions: SentimentResult['emotions'] = {}
  const emotionKeys = ['joy', 'sadness', 'anger', 'fear', 'surprise', 'love'] as const

  for (const emotion of emotionKeys) {
    const emotionScores = messageSentiments
      .map(s => s.emotions[emotion] || 0)
      .filter(score => score > 0)

    if (emotionScores.length > 0) {
      emotions[emotion] = emotionScores.reduce((sum, score) => sum + score, 0) / emotionScores.length
    }
  }

  // Determine overall label
  let label: SentimentResult['label'] = 'neutral'
  const positiveCount = messageSentiments.filter(s => s.label === 'positive').length
  const negativeCount = messageSentiments.filter(s => s.label === 'negative').length

  if (avgScore >= 0.6) {
    label = 'positive'
  } else if (avgScore <= 0.4) {
    label = 'negative'
  } else if (positiveCount > 0 && negativeCount > 0) {
    label = 'mixed'
  }

  // Average confidence
  const avgConfidence = messageSentiments.reduce((sum, s) => sum + s.confidence, 0) / messageSentiments.length

  return {
    score: Math.round(avgScore * 100) / 100,
    label,
    emotions,
    confidence: Math.round(avgConfidence * 100) / 100,
  }
}

/**
 * Get sentiment emoji for display
 */
export function getSentimentEmoji(label: string): string {
  switch (label) {
    case 'positive':
      return '😊'
    case 'negative':
      return '😞'
    case 'mixed':
      return '😐'
    default:
      return '😶'
  }
}

/**
 * Get sentiment color for UI
 */
export function getSentimentColor(label: string): string {
  switch (label) {
    case 'positive':
      return 'text-green-600 bg-green-50 border-green-200'
    case 'negative':
      return 'text-red-600 bg-red-50 border-red-200'
    case 'mixed':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}
