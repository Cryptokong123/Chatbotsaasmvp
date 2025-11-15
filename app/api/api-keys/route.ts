import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { createApiError } from '@/lib/api-errors'
import crypto from 'crypto'

// GET - Fetch API keys
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      const { response, status } = createApiError('UNAUTHORIZED')
      return NextResponse.json(response, { status })
    }

    const { data: apiKeys, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Don't send the full hash to the client
    const sanitizedKeys = apiKeys?.map(key => ({
      ...key,
      key_hash: undefined,
    }))

    return NextResponse.json({ apiKeys: sanitizedKeys || [] })
  } catch (error: any) {
    console.error('Error fetching API keys:', error)
    const { response, status } = createApiError('INTERNAL_ERROR', {
      errorMessage: error.message,
    })
    return NextResponse.json(response, { status })
  }
}

// POST - Create API key
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      const { response, status } = createApiError('UNAUTHORIZED')
      return NextResponse.json(response, { status })
    }

    const body = await request.json()
    const { name, rateLimit, expiresIn } = body

    if (!name) {
      const { response, status } = createApiError('MISSING_REQUIRED_FIELDS', {
        missing: ['name'],
      })
      return NextResponse.json(response, { status })
    }

    // Generate API key
    const apiKey = `ck_${crypto.randomBytes(32).toString('hex')}`
    const keyPrefix = apiKey.substring(0, 12) // Store prefix for display
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex')

    // Calculate expiration date
    let expiresAt = null
    if (expiresIn && expiresIn > 0) {
      expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + expiresIn)
    }

    // Create API key
    const { data: newKey, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        name,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        rate_limit: rateLimit || 1000,
        expires_at: expiresAt?.toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    // Return the full API key only this one time
    return NextResponse.json({
      apiKey: {
        ...newKey,
        key: apiKey, // Full key only returned once
        key_hash: undefined,
      },
      message: 'API key created successfully. Make sure to copy it now - you won\'t be able to see it again!',
    })
  } catch (error: any) {
    console.error('Error creating API key:', error)
    const { response, status } = createApiError('INTERNAL_ERROR', {
      errorMessage: error.message,
    })
    return NextResponse.json(response, { status })
  }
}

// DELETE - Revoke API key
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      const { response, status } = createApiError('UNAUTHORIZED')
      return NextResponse.json(response, { status })
    }

    const searchParams = request.nextUrl.searchParams
    const keyId = searchParams.get('keyId')

    if (!keyId) {
      const { response, status } = createApiError('MISSING_REQUIRED_FIELDS')
      return NextResponse.json(response, { status })
    }

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', keyId)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting API key:', error)
    const { response, status } = createApiError('INTERNAL_ERROR', {
      errorMessage: error.message,
    })
    return NextResponse.json(response, { status })
  }
}

// PATCH - Toggle API key active status
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      const { response, status } = createApiError('UNAUTHORIZED')
      return NextResponse.json(response, { status })
    }

    const body = await request.json()
    const { keyId, isActive } = body

    if (!keyId || typeof isActive !== 'boolean') {
      const { response, status } = createApiError('MISSING_REQUIRED_FIELDS')
      return NextResponse.json(response, { status })
    }

    const { error } = await supabase
      .from('api_keys')
      .update({ is_active: isActive })
      .eq('id', keyId)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating API key:', error)
    const { response, status } = createApiError('INTERNAL_ERROR', {
      errorMessage: error.message,
    })
    return NextResponse.json(response, { status })
  }
}
