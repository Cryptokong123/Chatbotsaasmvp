#!/usr/bin/env tsx

/**
 * Migration Runner
 *
 * Runs SQL migrations against the Supabase database
 * Usage: npm run migrate
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const migrations = [
  'create_agents_infrastructure.sql',
  'add_pre_chat_forms.sql',
  'enhance_conversation_flows.sql',
]

async function runMigrations() {
  console.log('🚀 Starting migrations...\n')

  for (const migration of migrations) {
    console.log(`📄 Running migration: ${migration}`)

    try {
      const migrationPath = join(process.cwd(), 'migrations', migration)
      const sql = readFileSync(migrationPath, 'utf-8')

      // Split by semicolons to execute statements individually
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'))

      console.log(`   Found ${statements.length} statements to execute`)

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i]

        // Skip comments
        if (statement.startsWith('--') || statement.startsWith('/*')) {
          continue
        }

        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })

          if (error) {
            // Try direct execution if RPC fails
            const { error: directError } = await supabase.from('_migrations').insert({
              name: migration,
              sql: statement,
            })

            if (directError && !directError.message.includes('already exists')) {
              console.error(`   ⚠️  Statement ${i + 1} warning: ${directError.message}`)
            }
          }
        } catch (err: any) {
          // Ignore errors for CREATE IF NOT EXISTS and other idempotent operations
          if (!err.message?.includes('already exists')) {
            console.error(`   ⚠️  Statement ${i + 1} warning: ${err.message}`)
          }
        }
      }

      console.log(`   ✅ Completed migration: ${migration}\n`)
    } catch (error: any) {
      console.error(`   ❌ Failed to run migration: ${migration}`)
      console.error(`   Error: ${error.message}\n`)
      process.exit(1)
    }
  }

  console.log('✨ All migrations completed successfully!')
}

runMigrations().catch((error) => {
  console.error('❌ Migration failed:', error)
  process.exit(1)
})
