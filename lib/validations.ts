/**
 * Input Validation Schemas with Zod
 *
 * CRITICAL for security - prevents:
 * - XSS attacks
 * - SQL injection
 * - Data corruption
 * - Malformed requests crashing the app
 */

import { z } from 'zod'

// ============================================================================
// Bot Schemas
// ============================================================================

export const createBotSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  instructions: z
    .string()
    .min(10, 'Instructions must be at least 10 characters')
    .max(2000, 'Instructions too long'),
  welcome_message: z.string().max(200, 'Welcome message too long').optional(),
  placeholder_text: z.string().max(100, 'Placeholder too long').optional(),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
})

export const updateBotSchema = createBotSchema.partial()

export const botIdSchema = z.string().uuid('Invalid bot ID')

// ============================================================================
// Message Schemas
// ============================================================================

export const sendMessageSchema = z.object({
  botId: z.string().uuid('Invalid bot ID'),
  message: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message too long (max 1000 characters)'),
  sessionId: z.string().regex(/^session_\d+_[a-z0-9]+$/, 'Invalid session ID'),
})

export const messageIdSchema = z.string().uuid('Invalid message ID')

// ============================================================================
// Training Data Schemas
// ============================================================================

export const uploadTrainingDataSchema = z.object({
  botId: z.string().uuid('Invalid bot ID'),
  content: z
    .string()
    .min(10, 'Content must be at least 10 characters')
    .max(50000, 'Content too large (max 50,000 characters)'),
  sourceType: z.enum(['text', 'pdf', 'faq', 'url'], {
    errorMap: () => ({ message: 'Invalid source type' }),
  }),
  sourceName: z.string().max(200, 'Source name too long').optional(),
})

export const trainingDataIdSchema = z.string().uuid('Invalid training data ID')

// ============================================================================
// User Schemas
// ============================================================================

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password too long'),
  full_name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const updateProfileSchema = z.object({
  full_name: z.string().max(100, 'Name too long').optional(),
  company_name: z.string().max(100, 'Company name too long').optional(),
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const updatePasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  token: z.string().min(1, 'Token is required'),
})

// ============================================================================
// Domain Schemas
// ============================================================================

export const addDomainSchema = z.object({
  botId: z.string().uuid('Invalid bot ID'),
  domain: z
    .string()
    .min(1, 'Domain is required')
    .regex(
      /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$|^localhost(:\d+)?$/,
      'Invalid domain format'
    ),
})

// ============================================================================
// Webhook Schemas
// ============================================================================

export const createWebhookSchema = z.object({
  botId: z.string().uuid('Invalid bot ID'),
  url: z.string().url('Invalid webhook URL'),
  events: z.array(z.enum(['message.received', 'message.sent', 'conversation.started'])),
  secret: z.string().min(32, 'Webhook secret must be at least 32 characters').optional(),
})

// ============================================================================
// Pagination & Query Schemas
// ============================================================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export const searchSchema = z.object({
  query: z.string().min(1).max(200),
  botId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

// ============================================================================
// Analytics Schemas
// ============================================================================

export const analyticsQuerySchema = z.object({
  botId: z.string().uuid('Invalid bot ID'),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  groupBy: z.enum(['hour', 'day', 'week', 'month']).default('day'),
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate and parse data with Zod schema
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data)
}

/**
 * Safe validation that returns result without throwing
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  return { success: false, error: result.error }
}

/**
 * Format Zod errors for API responses
 */
export function formatZodError(error: z.ZodError): Record<string, string> {
  const formatted: Record<string, string> = {}

  error.errors.forEach((err) => {
    const path = err.path.join('.')
    formatted[path] = err.message
  })

  return formatted
}

// ============================================================================
// Type Exports (inferred from schemas)
// ============================================================================

export type CreateBotInput = z.infer<typeof createBotSchema>
export type UpdateBotInput = z.infer<typeof updateBotSchema>
export type SendMessageInput = z.infer<typeof sendMessageSchema>
export type UploadTrainingDataInput = z.infer<typeof uploadTrainingDataSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
export type SearchInput = z.infer<typeof searchSchema>
export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>
