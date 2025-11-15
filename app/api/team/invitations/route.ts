import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { createApiError } from '@/lib/api-errors'
import crypto from 'crypto'

// GET - Fetch team invitations
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      const { response, status } = createApiError('UNAUTHORIZED')
      return NextResponse.json(response, { status })
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    // Get invitations
    const { data: invitations, error } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('organization_id', userData.organization_id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ invitations: invitations || [] })
  } catch (error: any) {
    console.error('Error fetching invitations:', error)
    const { response, status } = createApiError('INTERNAL_ERROR', {
      errorMessage: error.message,
    })
    return NextResponse.json(response, { status })
  }
}

// POST - Create team invitation
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      const { response, status } = createApiError('UNAUTHORIZED')
      return NextResponse.json(response, { status })
    }

    const body = await request.json()
    const { email, role } = body

    if (!email || !role) {
      const { response, status } = createApiError('MISSING_REQUIRED_FIELDS')
      return NextResponse.json(response, { status })
    }

    // Validate role
    if (!['admin', 'member', 'viewer'].includes(role)) {
      const { response, status } = createApiError('INTERNAL_ERROR', {
        errorMessage: 'Invalid role. Must be admin, member, or viewer',
      })
      return NextResponse.json(response, { status })
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    // Check if user is owner or admin
    const { data: currentMember } = await supabase
      .from('team_members')
      .select('role')
      .eq('organization_id', userData.organization_id)
      .eq('user_id', user.id)
      .single()

    if (!currentMember || !['owner', 'admin'].includes(currentMember.role)) {
      const { response, status } = createApiError('UNAUTHORIZED', {
        errorMessage: 'Only owners and admins can invite team members',
      })
      return NextResponse.json(response, { status })
    }

    // Check if user is already a team member
    const { data: existingMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('organization_id', userData.organization_id)
      .eq('user_id', user.id)
      .single()

    if (existingMember) {
      const { response, status } = createApiError('INTERNAL_ERROR', {
        errorMessage: 'User is already a team member',
      })
      return NextResponse.json(response, { status })
    }

    // Check if there's already a pending invitation
    const { data: existingInvitation } = await supabase
      .from('team_invitations')
      .select('id')
      .eq('organization_id', userData.organization_id)
      .eq('email', email)
      .eq('status', 'pending')
      .single()

    if (existingInvitation) {
      const { response, status } = createApiError('INTERNAL_ERROR', {
        errorMessage: 'There is already a pending invitation for this email',
      })
      return NextResponse.json(response, { status })
    }

    // Generate invitation token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiration

    // Create invitation
    const { data: invitation, error } = await supabase
      .from('team_invitations')
      .insert({
        organization_id: userData.organization_id,
        email,
        role,
        invited_by: user.id,
        token,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    // TODO: Send invitation email
    // For now, we'll just return the invitation link
    const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${token}`

    return NextResponse.json({
      invitation,
      invitationLink,
      message: 'Invitation created successfully',
    })
  } catch (error: any) {
    console.error('Error creating invitation:', error)
    const { response, status } = createApiError('INTERNAL_ERROR', {
      errorMessage: error.message,
    })
    return NextResponse.json(response, { status })
  }
}

// DELETE - Revoke invitation
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      const { response, status } = createApiError('UNAUTHORIZED')
      return NextResponse.json(response, { status })
    }

    const searchParams = request.nextUrl.searchParams
    const invitationId = searchParams.get('invitationId')

    if (!invitationId) {
      const { response, status } = createApiError('MISSING_REQUIRED_FIELDS')
      return NextResponse.json(response, { status })
    }

    // Update invitation status to revoked
    const { error } = await supabase
      .from('team_invitations')
      .update({ status: 'revoked' })
      .eq('id', invitationId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error revoking invitation:', error)
    const { response, status } = createApiError('INTERNAL_ERROR', {
      errorMessage: error.message,
    })
    return NextResponse.json(response, { status })
  }
}
