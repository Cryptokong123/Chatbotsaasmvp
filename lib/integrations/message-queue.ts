/**
 * Message Queue System
 *
 * Async message processing with rate limiting, delivery guarantees, and retry logic
 */

import { EventEmitter } from 'events'

// ============================================================================
// TYPES
// ============================================================================

export interface QueueMessage<T = any> {
  id: string
  type: string
  data: T
  priority: 'low' | 'normal' | 'high' | 'critical'
  attempts: number
  maxAttempts: number
  createdAt: Date
  scheduledFor?: Date
  processedAt?: Date
  error?: string
  metadata?: Record<string, any>
}

export interface QueueConfig {
  concurrency?: number
  retryAttempts?: number
  retryDelay?: number
  retryBackoff?: number
  timeout?: number
  deadLetterQueue?: boolean
}

export interface QueueStats {
  pending: number
  processing: number
  completed: number
  failed: number
  deadLetter: number
  totalProcessed: number
  averageProcessingTime: number
  successRate: number
}

// ============================================================================
// MESSAGE QUEUE
// ============================================================================

export class MessageQueue extends EventEmitter {
  private queues: Map<string, QueueMessage[]> = new Map()
  private processing: Map<string, QueueMessage[]> = new Map()
  private completed: Map<string, QueueMessage[]> = new Map()
  private failed: Map<string, QueueMessage[]> = new Map()
  private deadLetter: Map<string, QueueMessage[]> = new Map()

  private processors: Map<string, (message: QueueMessage) => Promise<void>> = new Map()
  private config: Required<QueueConfig>
  private isRunning = false
  private stats = new Map<string, {
    totalProcessed: number
    totalFailed: number
    totalTime: number
  }>()

  constructor(config: QueueConfig = {}) {
    super()

    this.config = {
      concurrency: config.concurrency || 10,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      retryBackoff: config.retryBackoff || 2,
      timeout: config.timeout || 30000,
      deadLetterQueue: config.deadLetterQueue ?? true,
    }
  }

  // ============================================================================
  // QUEUE MANAGEMENT
  // ============================================================================

  /**
   * Register a message processor
   */
  registerProcessor(
    queueName: string,
    processor: (message: QueueMessage) => Promise<void>
  ): void {
    this.processors.set(queueName, processor)

    // Initialize queue structures
    if (!this.queues.has(queueName)) {
      this.queues.set(queueName, [])
      this.processing.set(queueName, [])
      this.completed.set(queueName, [])
      this.failed.set(queueName, [])
      this.deadLetter.set(queueName, [])
      this.stats.set(queueName, { totalProcessed: 0, totalFailed: 0, totalTime: 0 })
    }
  }

  /**
   * Add message to queue
   */
  async enqueue<T = any>(
    queueName: string,
    type: string,
    data: T,
    options: {
      priority?: QueueMessage['priority']
      scheduledFor?: Date
      maxAttempts?: number
      metadata?: Record<string, any>
    } = {}
  ): Promise<string> {
    if (!this.queues.has(queueName)) {
      throw new Error(`Queue ${queueName} not registered`)
    }

    const message: QueueMessage<T> = {
      id: this.generateId(),
      type,
      data,
      priority: options.priority || 'normal',
      attempts: 0,
      maxAttempts: options.maxAttempts || this.config.retryAttempts,
      createdAt: new Date(),
      scheduledFor: options.scheduledFor,
      metadata: options.metadata,
    }

    const queue = this.queues.get(queueName)!
    queue.push(message)

    // Sort by priority (critical > high > normal > low) and then by createdAt
    queue.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 }
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff
      return a.createdAt.getTime() - b.createdAt.getTime()
    })

    this.emit('message:enqueued', { queueName, message })

    // Start processing if not already running
    if (!this.isRunning) {
      this.start()
    }

    return message.id
  }

  /**
   * Start queue processing
   */
  start(): void {
    if (this.isRunning) return

    this.isRunning = true
    this.processQueues()
    this.emit('queue:started')
  }

  /**
   * Stop queue processing
   */
  async stop(graceful = true): Promise<void> {
    this.isRunning = false

    if (graceful) {
      // Wait for all processing messages to complete
      const allProcessing = Array.from(this.processing.values()).flat()
      while (allProcessing.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    this.emit('queue:stopped')
  }

  /**
   * Process all queues
   */
  private async processQueues(): Promise<void> {
    while (this.isRunning) {
      for (const [queueName, queue] of this.queues.entries()) {
        const processing = this.processing.get(queueName)!

        // Check concurrency limit
        if (processing.length >= this.config.concurrency) {
          continue
        }

        // Get next message
        const message = this.getNextMessage(queue)

        if (message) {
          // Move to processing
          const index = queue.indexOf(message)
          queue.splice(index, 1)
          processing.push(message)

          // Process message
          this.processMessage(queueName, message).catch(console.error)
        }
      }

      // Small delay to prevent CPU spinning
      await new Promise(resolve => setTimeout(resolve, 10))
    }
  }

  /**
   * Get next message to process
   */
  private getNextMessage(queue: QueueMessage[]): QueueMessage | null {
    const now = new Date()

    for (const message of queue) {
      // Skip if scheduled for future
      if (message.scheduledFor && message.scheduledFor > now) {
        continue
      }

      return message
    }

    return null
  }

  /**
   * Process a single message
   */
  private async processMessage(queueName: string, message: QueueMessage): Promise<void> {
    const processor = this.processors.get(queueName)
    if (!processor) {
      throw new Error(`No processor registered for queue ${queueName}`)
    }

    const startTime = Date.now()
    message.attempts++

    this.emit('message:processing', { queueName, message })

    try {
      // Process with timeout
      await this.withTimeout(processor(message), this.config.timeout)

      // Success
      const duration = Date.now() - startTime
      message.processedAt = new Date()

      // Move to completed
      const processing = this.processing.get(queueName)!
      const index = processing.indexOf(message)
      processing.splice(index, 1)

      const completed = this.completed.get(queueName)!
      completed.push(message)

      // Update stats
      const stats = this.stats.get(queueName)!
      stats.totalProcessed++
      stats.totalTime += duration

      this.emit('message:completed', { queueName, message, duration })
    } catch (error: any) {
      // Failure
      const duration = Date.now() - startTime
      message.error = error.message

      // Move from processing
      const processing = this.processing.get(queueName)!
      const index = processing.indexOf(message)
      processing.splice(index, 1)

      // Check if should retry
      if (message.attempts < message.maxAttempts) {
        // Calculate retry delay with exponential backoff
        const delay = this.config.retryDelay * Math.pow(this.config.retryBackoff, message.attempts - 1)
        message.scheduledFor = new Date(Date.now() + delay)

        // Re-enqueue
        const queue = this.queues.get(queueName)!
        queue.push(message)

        this.emit('message:retry', { queueName, message, attempt: message.attempts, delay })
      } else {
        // Max attempts reached
        if (this.config.deadLetterQueue) {
          // Move to dead letter queue
          const deadLetter = this.deadLetter.get(queueName)!
          deadLetter.push(message)

          this.emit('message:dead_letter', { queueName, message })
        } else {
          // Move to failed
          const failed = this.failed.get(queueName)!
          failed.push(message)
        }

        // Update stats
        const stats = this.stats.get(queueName)!
        stats.totalFailed++

        this.emit('message:failed', { queueName, message, error: error.message })
      }
    }
  }

  /**
   * Execute with timeout
   */
  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Processing timeout')), timeoutMs)
      ),
    ])
  }

  // ============================================================================
  // QUERY & STATS
  // ============================================================================

  /**
   * Get queue stats
   */
  getStats(queueName: string): QueueStats {
    const queue = this.queues.get(queueName) || []
    const processing = this.processing.get(queueName) || []
    const completed = this.completed.get(queueName) || []
    const failed = this.failed.get(queueName) || []
    const deadLetter = this.deadLetter.get(queueName) || []
    const stats = this.stats.get(queueName) || { totalProcessed: 0, totalFailed: 0, totalTime: 0 }

    const averageProcessingTime = stats.totalProcessed > 0
      ? stats.totalTime / stats.totalProcessed
      : 0

    const successRate = (stats.totalProcessed + stats.totalFailed) > 0
      ? (stats.totalProcessed / (stats.totalProcessed + stats.totalFailed)) * 100
      : 0

    return {
      pending: queue.length,
      processing: processing.length,
      completed: completed.length,
      failed: failed.length,
      deadLetter: deadLetter.length,
      totalProcessed: stats.totalProcessed,
      averageProcessingTime,
      successRate,
    }
  }

  /**
   * Get all queue names
   */
  getQueueNames(): string[] {
    return Array.from(this.queues.keys())
  }

  /**
   * Get messages in queue
   */
  getMessages(queueName: string, status: 'pending' | 'processing' | 'completed' | 'failed' | 'dead_letter'): QueueMessage[] {
    switch (status) {
      case 'pending':
        return [...(this.queues.get(queueName) || [])]
      case 'processing':
        return [...(this.processing.get(queueName) || [])]
      case 'completed':
        return [...(this.completed.get(queueName) || [])]
      case 'failed':
        return [...(this.failed.get(queueName) || [])]
      case 'dead_letter':
        return [...(this.deadLetter.get(queueName) || [])]
      default:
        return []
    }
  }

  /**
   * Find message by ID
   */
  findMessage(messageId: string): { queueName: string; message: QueueMessage; status: string } | null {
    for (const [queueName, queue] of this.queues.entries()) {
      const message = queue.find(m => m.id === messageId)
      if (message) return { queueName, message, status: 'pending' }
    }

    for (const [queueName, processing] of this.processing.entries()) {
      const message = processing.find(m => m.id === messageId)
      if (message) return { queueName, message, status: 'processing' }
    }

    for (const [queueName, completed] of this.completed.entries()) {
      const message = completed.find(m => m.id === messageId)
      if (message) return { queueName, message, status: 'completed' }
    }

    for (const [queueName, failed] of this.failed.entries()) {
      const message = failed.find(m => m.id === messageId)
      if (message) return { queueName, message, status: 'failed' }
    }

    for (const [queueName, deadLetter] of this.deadLetter.entries()) {
      const message = deadLetter.find(m => m.id === messageId)
      if (message) return { queueName, message, status: 'dead_letter' }
    }

    return null
  }

  // ============================================================================
  // MANAGEMENT
  // ============================================================================

  /**
   * Retry a failed message
   */
  async retryMessage(messageId: string): Promise<boolean> {
    for (const [queueName, failed] of this.failed.entries()) {
      const index = failed.findIndex(m => m.id === messageId)
      if (index !== -1) {
        const message = failed.splice(index, 1)[0]
        message.attempts = 0
        message.error = undefined
        message.scheduledFor = undefined

        const queue = this.queues.get(queueName)!
        queue.push(message)

        this.emit('message:retried', { queueName, message })
        return true
      }
    }

    // Also check dead letter queue
    for (const [queueName, deadLetter] of this.deadLetter.entries()) {
      const index = deadLetter.findIndex(m => m.id === messageId)
      if (index !== -1) {
        const message = deadLetter.splice(index, 1)[0]
        message.attempts = 0
        message.error = undefined
        message.scheduledFor = undefined

        const queue = this.queues.get(queueName)!
        queue.push(message)

        this.emit('message:retried', { queueName, message })
        return true
      }
    }

    return false
  }

  /**
   * Clear completed messages
   */
  clearCompleted(queueName?: string): number {
    let count = 0

    if (queueName) {
      const completed = this.completed.get(queueName)
      if (completed) {
        count = completed.length
        completed.length = 0
      }
    } else {
      for (const completed of this.completed.values()) {
        count += completed.length
        completed.length = 0
      }
    }

    this.emit('queue:cleared', { queueName, type: 'completed', count })
    return count
  }

  /**
   * Clear failed messages
   */
  clearFailed(queueName?: string): number {
    let count = 0

    if (queueName) {
      const failed = this.failed.get(queueName)
      if (failed) {
        count = failed.length
        failed.length = 0
      }
    } else {
      for (const failed of this.failed.values()) {
        count += failed.length
        failed.length = 0
      }
    }

    this.emit('queue:cleared', { queueName, type: 'failed', count })
    return count
  }

  /**
   * Purge all messages from queue
   */
  purge(queueName: string): number {
    const queue = this.queues.get(queueName)
    const count = queue ? queue.length : 0

    if (queue) {
      queue.length = 0
    }

    this.emit('queue:purged', { queueName, count })
    return count
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Generate unique message ID
   */
  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// ============================================================================
// PRIORITY QUEUE (for rate limiting)
// ============================================================================

export class PriorityQueue<T> {
  private items: Array<{ item: T; priority: number }> = []

  enqueue(item: T, priority: number): void {
    this.items.push({ item, priority })
    this.items.sort((a, b) => b.priority - a.priority)
  }

  dequeue(): T | undefined {
    const result = this.items.shift()
    return result?.item
  }

  peek(): T | undefined {
    return this.items[0]?.item
  }

  get size(): number {
    return this.items.length
  }

  isEmpty(): boolean {
    return this.items.length === 0
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default MessageQueue
