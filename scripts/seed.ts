#!/usr/bin/env tsx

/**
 * Seed Script for Development
 *
 * Creates sample data for testing
 * Run with: npm run seed
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seed() {
  console.log('🌱 Seeding database...')

  try {
    // Create a test user (manually create in Supabase dashboard first)
    const testUserId = 'YOUR_TEST_USER_ID' // Replace with actual user ID

    // Create sample bots
    const { data: bots, error: botsError } = await supabase
      .from('bots')
      .insert([
        {
          user_id: testUserId,
          name: 'Customer Support Bot',
          description: 'Handles customer inquiries',
          instructions: 'You are a helpful customer support assistant.',
          welcome_message: 'Hi! How can I help you today?',
          primary_color: '#6C47FF',
        },
        {
          user_id: testUserId,
          name: 'FAQ Bot',
          description: 'Answers frequently asked questions',
          instructions: 'Answer questions from the FAQ.',
          welcome_message: 'Ask me anything!',
          primary_color: '#10B981',
        },
      ])
      .select()

    if (botsError) {
      console.error('Error creating bots:', botsError)
      return
    }

    console.log(`✅ Created ${bots.length} sample bots`)

    // Create sample training data
    if (bots.length > 0) {
      const bot = bots[0]

      const { error: trainingError } = await supabase.from('training_data').insert([
        {
          bot_id: bot.id,
          content: 'We offer 24/7 customer support through live chat and email.',
          source_type: 'text',
          source_name: 'Support Info',
          chunk_index: 0,
        },
        {
          bot_id: bot.id,
          content: 'Our refund policy allows returns within 30 days of purchase.',
          source_type: 'faq',
          source_name: 'FAQ',
          chunk_index: 0,
        },
        {
          bot_id: bot.id,
          content: 'Shipping typically takes 3-5 business days.',
          source_type: 'text',
          source_name: 'Shipping Info',
          chunk_index: 0,
        },
      ])

      if (trainingError) {
        console.error('Error creating training data:', trainingError)
      } else {
        console.log('✅ Created sample training data')
      }
    }

    console.log('🎉 Seeding complete!')
  } catch (error) {
    console.error('Seeding error:', error)
    process.exit(1)
  }
}

seed()
