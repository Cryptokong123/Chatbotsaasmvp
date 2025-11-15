/**
 * Health Check Endpoint
 *
 * Checks the health of the application and its dependencies
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  checks: {
    database: {
      status: 'up' | 'down'
      responseTime?: number
      error?: string
    }
    auth: {
      status: 'up' | 'down'
      responseTime?: number
      error?: string
    }
    environment: {
      status: 'ok' | 'missing_vars'
      missingVars?: string[]
    }
  }
  version: string
  uptime: number
}

const startTime = Date.now()

export async function GET(request: NextRequest) {
  const healthCheck: HealthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: { status: 'down' },
      auth: { status: 'down' },
      environment: { status: 'ok' },
    },
    version: process.env.npm_package_version || '1.0.0',
    uptime: Date.now() - startTime,
  }

  // Check database connection
  try {
    const dbStart = Date.now()
    const supabase = await createClient()

    const { error } = await supabase
      .from('bots')
      .select('id')
      .limit(1)

    const dbTime = Date.now() - dbStart

    if (error) {
      healthCheck.checks.database = {
        status: 'down',
        error: error.message,
      }
      healthCheck.status = 'unhealthy'
    } else {
      healthCheck.checks.database = {
        status: 'up',
        responseTime: dbTime,
      }
    }
  } catch (error: any) {
    healthCheck.checks.database = {
      status: 'down',
      error: error.message,
    }
    healthCheck.status = 'unhealthy'
  }

  // Check auth service
  try {
    const authStart = Date.now()
    const supabase = await createClient()

    const { error } = await supabase.auth.getSession()
    const authTime = Date.now() - authStart

    if (error) {
      healthCheck.checks.auth = {
        status: 'down',
        error: error.message,
      }
      healthCheck.status = healthCheck.status === 'unhealthy' ? 'unhealthy' : 'degraded'
    } else {
      healthCheck.checks.auth = {
        status: 'up',
        responseTime: authTime,
      }
    }
  } catch (error: any) {
    healthCheck.checks.auth = {
      status: 'down',
      error: error.message,
    }
    healthCheck.status = healthCheck.status === 'unhealthy' ? 'unhealthy' : 'degraded'
  }

  // Check environment variables
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ]

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  )

  if (missingVars.length > 0) {
    healthCheck.checks.environment = {
      status: 'missing_vars',
      missingVars,
    }
    healthCheck.status = 'unhealthy'
  }

  // Set appropriate status code
  const statusCode = healthCheck.status === 'healthy' ? 200 : healthCheck.status === 'degraded' ? 200 : 503

  return NextResponse.json(healthCheck, { status: statusCode })
}
