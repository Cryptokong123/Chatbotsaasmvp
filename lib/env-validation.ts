/**
 * Environment Variable Validation
 *
 * Validates required environment variables at application startup
 */

interface EnvVar {
  name: string
  required: boolean
  description: string
  validation?: (value: string) => boolean
}

const ENV_VARS: EnvVar[] = [
  // Required Supabase variables
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    description: 'Supabase project URL',
    validation: (value) => value.startsWith('https://') && value.includes('.supabase.co'),
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    description: 'Supabase anonymous key',
    validation: (value) => value.length > 100, // Supabase keys are long
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: true,
    description: 'Supabase service role key (server-side only)',
    validation: (value) => value.length > 100,
  },

  // Required App variables
  {
    name: 'NEXT_PUBLIC_APP_URL',
    required: true,
    description: 'Application base URL',
    validation: (value) => value.startsWith('http://') || value.startsWith('https://'),
  },

  // Optional AI variables
  {
    name: 'OPENAI_API_KEY',
    required: false,
    description: 'OpenAI API key for AI features',
    validation: (value) => value.startsWith('sk-'),
  },

  // Optional Email variables
  {
    name: 'RESEND_API_KEY',
    required: false,
    description: 'Resend API key for email',
    validation: (value) => value.startsWith('re_'),
  },
  {
    name: 'EMAIL_FROM',
    required: false,
    description: 'Email sender address',
    validation: (value) => value.includes('@'),
  },

  // Optional Analytics variables
  {
    name: 'NEXT_PUBLIC_POSTHOG_KEY',
    required: false,
    description: 'PostHog analytics key',
  },
  {
    name: 'NEXT_PUBLIC_SENTRY_DSN',
    required: false,
    description: 'Sentry error tracking DSN',
  },

  // Optional Payment variables
  {
    name: 'STRIPE_SECRET_KEY',
    required: false,
    description: 'Stripe secret key',
    validation: (value) => value.startsWith('sk_'),
  },
  {
    name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    required: false,
    description: 'Stripe publishable key',
    validation: (value) => value.startsWith('pk_'),
  },
]

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validate all environment variables
 */
export function validateEnv(): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  for (const envVar of ENV_VARS) {
    const value = process.env[envVar.name]

    if (!value || value.trim() === '') {
      if (envVar.required) {
        errors.push(`Missing required environment variable: ${envVar.name} (${envVar.description})`)
      } else {
        warnings.push(`Optional environment variable not set: ${envVar.name} (${envVar.description})`)
      }
      continue
    }

    // Check if value looks like a placeholder
    if (value.includes('your-') || value.includes('your_') || value === 'undefined' || value === 'null') {
      if (envVar.required) {
        errors.push(`Environment variable ${envVar.name} appears to be a placeholder value: "${value}"`)
      } else {
        warnings.push(`Environment variable ${envVar.name} appears to be a placeholder value: "${value}"`)
      }
      continue
    }

    // Run custom validation if provided
    if (envVar.validation) {
      try {
        if (!envVar.validation(value)) {
          if (envVar.required) {
            errors.push(`Environment variable ${envVar.name} failed validation (${envVar.description})`)
          } else {
            warnings.push(`Environment variable ${envVar.name} failed validation (${envVar.description})`)
          }
        }
      } catch (error) {
        errors.push(`Error validating ${envVar.name}: ${error}`)
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate and throw if invalid (use at app startup)
 */
export function validateEnvOrThrow(): void {
  const result = validateEnv()

  // Log warnings
  if (result.warnings.length > 0) {
    console.warn('⚠️  Environment Variable Warnings:')
    result.warnings.forEach((warning) => console.warn(`  - ${warning}`))
    console.warn('')
  }

  // Throw on errors
  if (!result.valid) {
    console.error('❌ Environment Variable Errors:')
    result.errors.forEach((error) => console.error(`  - ${error}`))
    console.error('')
    console.error('Please check your .env.local file and compare it with .env.example')
    throw new Error('Invalid environment configuration')
  }

  console.log('✅ Environment variables validated successfully')
}

/**
 * Get environment variable with fallback
 */
export function getEnv(key: string, fallback?: string): string {
  const value = process.env[key]
  if (!value) {
    if (fallback !== undefined) {
      return fallback
    }
    throw new Error(`Missing environment variable: ${key}`)
  }
  return value
}

/**
 * Check if a feature is enabled based on env var
 */
export function isFeatureEnabled(featureName: string): boolean {
  const envVarName = `NEXT_PUBLIC_ENABLE_${featureName.toUpperCase()}`
  const value = process.env[envVarName]
  return value === 'true' || value === '1'
}

/**
 * Get all environment info for debugging (sanitized)
 */
export function getEnvInfo(): Record<string, { set: boolean; valid: boolean }> {
  const info: Record<string, { set: boolean; valid: boolean }> = {}

  for (const envVar of ENV_VARS) {
    const value = process.env[envVar.name]
    const isSet = !!value && value.trim() !== ''
    let isValid = isSet

    if (isSet && envVar.validation) {
      try {
        isValid = envVar.validation(value!)
      } catch {
        isValid = false
      }
    }

    info[envVar.name] = {
      set: isSet,
      valid: isValid,
    }
  }

  return info
}
