import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

/**
 * POST /api/training/scrape-url
 * Scrape content from a URL and add it to bot training data
 */
export async function POST(request: NextRequest) {
  try {
    const { botId, url } = await request.json()

    if (!botId || !url) {
      return NextResponse.json(
        { error: 'Bot ID and URL are required' },
        { status: 400 }
      )
    }

    // Validate URL format
    let validUrl: URL
    try {
      validUrl = new URL(url)
      if (!['http:', 'https:'].includes(validUrl.protocol)) {
        throw new Error('Invalid protocol')
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format. Please provide a valid HTTP or HTTPS URL.' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    // Verify user owns this bot
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: bot, error: botError } = await supabase
      .from('bots')
      .select('id, user_id, name')
      .eq('id', botId)
      .single()

    if (botError || !bot || bot.user_id !== user.id) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
    }

    // Fetch and parse the URL
    let content: string
    let title: string

    try {
      const response = await fetch(validUrl.href, {
        headers: {
          'User-Agent': 'ChatForge-AI-Bot/1.0',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`)
      }

      const contentType = response.headers.get('content-type') || ''

      if (!contentType.includes('text/html')) {
        return NextResponse.json(
          { error: 'URL must point to an HTML page' },
          { status: 400 }
        )
      }

      const html = await response.text()

      // Extract title
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      title = titleMatch ? titleMatch[1].trim() : validUrl.hostname

      // Simple HTML to text conversion
      // Remove script and style tags
      let text = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ') // Remove HTML tags
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim()

      // Limit content size (max 50,000 characters)
      if (text.length > 50000) {
        text = text.substring(0, 50000) + '...'
      }

      if (text.length < 100) {
        return NextResponse.json(
          { error: 'Not enough content found on the page' },
          { status: 400 }
        )
      }

      content = text
    } catch (error: any) {
      console.error('Error scraping URL:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to scrape URL. Please check the URL and try again.' },
        { status: 500 }
      )
    }

    // Add to training data
    const { data: trainingData, error: insertError } = await supabase
      .from('training_data')
      .insert({
        bot_id: botId,
        content: content,
        source_type: 'url',
        metadata: {
          url: validUrl.href,
          title: title,
          scraped_at: new Date().toISOString(),
          word_count: content.split(/\s+/).length,
        },
      })
      .select()
      .single()

    if (insertError) throw insertError

    return NextResponse.json({
      success: true,
      trainingData,
      stats: {
        url: validUrl.href,
        title,
        contentLength: content.length,
        wordCount: content.split(/\s+/).length,
      },
    })
  } catch (error: any) {
    console.error('Error scraping URL:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to scrape URL' },
      { status: 500 }
    )
  }
}
