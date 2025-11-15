/**
 * API Error Handling Utilities
 * Provides structured error responses with error codes for better debugging
 */

export interface ApiError {
  error: string
  code: string
  message: string
  action?: string
  requestId?: string
  timestamp: string
  details?: any
}

/**
 * Standard error codes and messages
 */
export const ERROR_CODES = {
  // Authentication & Authorization (1xxx)
  UNAUTHORIZED: {
    code: 'AUTH_001',
    message: 'You must be logged in to perform this action',
    action: 'Please sign in and try again',
    status: 401,
  },
  FORBIDDEN: {
    code: 'AUTH_002',
    message: 'You do not have permission to perform this action',
    action: 'Contact the resource owner for access',
    status: 403,
  },
  SESSION_EXPIRED: {
    code: 'AUTH_003',
    message: 'Your session has expired',
    action: 'Please sign in again',
    status: 401,
  },

  // Resource Errors (2xxx)
  BOT_NOT_FOUND: {
    code: 'BOT_001',
    message: 'The bot you\'re trying to access doesn\'t exist',
    action: 'Check the bot ID is correct',
    status: 404,
  },
  BOT_INACTIVE: {
    code: 'BOT_002',
    message: 'This bot is currently inactive',
    action: 'Activate the bot in settings to use it',
    status: 403,
  },
  TRAINING_DATA_NOT_FOUND: {
    code: 'DATA_001',
    message: 'Training data not found',
    action: 'Check the training data ID',
    status: 404,
  },
  ACTION_NOT_FOUND: {
    code: 'ACTION_001',
    message: 'Bot action not found',
    action: 'Check the action ID and configuration',
    status: 404,
  },

  // Validation Errors (3xxx)
  MISSING_REQUIRED_FIELDS: {
    code: 'VAL_001',
    message: 'Required fields are missing',
    action: 'Check the API documentation for required fields',
    status: 400,
  },
  INVALID_INPUT: {
    code: 'VAL_002',
    message: 'Invalid input provided',
    action: 'Check that all fields are in the correct format',
    status: 400,
  },
  MESSAGE_TOO_LONG: {
    code: 'MSG_001',
    message: 'Message exceeds maximum length (1000 characters)',
    action: 'Please shorten your message',
    status: 400,
  },
  INVALID_URL: {
    code: 'VAL_003',
    message: 'Invalid URL format',
    action: 'Provide a valid HTTP or HTTPS URL',
    status: 400,
  },
  INVALID_EMAIL: {
    code: 'VAL_004',
    message: 'Invalid email address',
    action: 'Provide a valid email address',
    status: 400,
  },

  // Rate Limiting (4xxx)
  RATE_LIMITED: {
    code: 'RATE_001',
    message: 'Too many requests too quickly',
    action: 'Please wait a moment and try again',
    status: 429,
  },
  QUOTA_EXCEEDED: {
    code: 'RATE_002',
    message: 'Usage quota exceeded for your plan',
    action: 'Upgrade your plan or wait until quota resets',
    status: 429,
  },

  // External Service Errors (5xxx)
  OPENAI_ERROR: {
    code: 'EXT_001',
    message: 'AI service is temporarily unavailable',
    action: 'Please try again in a moment',
    status: 503,
  },
  WEBHOOK_FAILED: {
    code: 'EXT_002',
    message: 'Webhook execution failed',
    action: 'Check your webhook URL and configuration',
    status: 500,
  },
  SCRAPING_FAILED: {
    code: 'EXT_003',
    message: 'Failed to scrape content from URL',
    action: 'Ensure the URL is accessible and returns HTML content',
    status: 500,
  },

  // Database Errors (6xxx)
  DATABASE_ERROR: {
    code: 'DB_001',
    message: 'Database operation failed',
    action: 'Please try again later',
    status: 500,
  },
  DUPLICATE_ENTRY: {
    code: 'DB_002',
    message: 'A resource with this identifier already exists',
    action: 'Use a unique identifier',
    status: 409,
  },

  // Generic Errors (9xxx)
  INTERNAL_ERROR: {
    code: 'ERR_001',
    message: 'An unexpected error occurred',
    action: 'Please try again later',
    status: 500,
  },
  NOT_IMPLEMENTED: {
    code: 'ERR_002',
    message: 'This feature is not yet implemented',
    action: 'Check back later or contact support',
    status: 501,
  },
} as const

export type ErrorCodeKey = keyof typeof ERROR_CODES

/**
 * Create a structured API error response
 */
export function createApiError(
  errorCodeKey: ErrorCodeKey,
  details?: any
): {
  response: ApiError
  status: number
} {
  const errorDef = ERROR_CODES[errorCodeKey]
  
  return {
    response: {
      error: errorDef.message,
      code: errorDef.code,
      message: errorDef.message,
      action: errorDef.action,
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...(details && { details }),
    },
    status: errorDef.status,
  }
}

/**
 * Create a custom API error with specific message
 */
export function createCustomError(
  code: string,
  message: string,
  action: string,
  status: number = 500,
  details?: any
): {
  response: ApiError
  status: number
} {
  return {
    response: {
      error: message,
      code,
      message,
      action,
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...(details && { details }),
    },
    status,
  }
}

/**
 * Parse and standardize Supabase errors
 */
export function handleSupabaseError(error: any): {
  response: ApiError
  status: number
} {
  // Check for specific Supabase error codes
  if (error.code === 'PGRST116') {
    // Not found
    return createApiError('BOT_NOT_FOUND')
  }
  
  if (error.code === '23505') {
    // Duplicate key
    return createApiError('DUPLICATE_ENTRY')
  }

  // Default to database error
  return createApiError('DATABASE_ERROR', { originalError: error.message })
}

/**
 * Parse and standardize OpenAI errors
 */
export function handleOpenAIError(error: any): {
  response: ApiError
  status: number
} {
  if (error.code === 'rate_limit_exceeded' || error.status === 429) {
    return createApiError('RATE_LIMITED')
  }

  if (error.code === 'invalid_api_key' || error.status === 401) {
    return createCustomError(
      'CONFIG_001',
      'AI service configuration error',
      'Contact system administrator',
      500
    )
  }

  return createApiError('OPENAI_ERROR', { originalError: error.message })
}
