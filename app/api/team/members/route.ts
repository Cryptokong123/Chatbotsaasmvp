import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { createApiError } from '@/lib/api-errors'

// GET - Fetch team members
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      const { response, status } = createApiError('UNAUTHORIZED')
      return NextResponse.json(response, { status })
    }

    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (userError) throw userError

    // Get team members
    const { data: members, error } = await supabase
      .from('team_members')
      .select(`
        *,
        user:user_id (
          id,
          email,
          raw_user_meta_data
        )
      `)
      .eq('organization_id', userData.organization_id)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ members: members || [] })
  } catch (error: any) {
    console.error('Error fetching team members:', error)
    const { response, status } = createApiError('INTERNAL_ERROR', {
      errorMessage: error.message,
    })
    return NextResponse.json(response, { status })
  }
}

// DELETE - Remove team member
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      const { response, status } = createApiError('UNAUTHORIZED')
      return NextResponse.json(response, { status })
    }

    const searchParams = request.nextUrl.searchParams
    const memberId = searchParams.get('memberId')

    if (!memberId) {
      const { response, status } = createApiError('MISSING_REQUIRED_FIELDS')
      return NextResponse.json(response, { status })
    }

    // Check if user is owner or admin
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    const { data: currentMember } = await supabase
      .from('team_members')
      .select('role')
      .eq('organization_id', userData.organization_id)
      .eq('user_id', user.id)
      .single()

    if (!currentMember || !['owner', 'admin'].includes(currentMember.role)) {
      const { response, status } = createApiError('UNAUTHORIZED', {
        errorMessage: 'Only owners and admins can remove team members',
      })
      return NextResponse.json(response, { status })
    }

    // Don't allow removing the last owner
    const { data: member } = await supabase
      .from('team_members')
      .select('role, organization_id')
      .eq('id', memberId)
      .single()

    if (member?.role === 'owner') {
      const { data: ownerCount } = await supabase
        .from('team_members')
        .select('id', { count: 'exact' })
        .eq('organization_id', member.organization_id)
        .eq('role', 'owner')

      if ((ownerCount as any)?.length <= 1) {
        const { response, status } = createApiError('INTERNAL_ERROR', {
          errorMessage: 'Cannot remove the last owner',
        })
        return NextResponse.json(response, { status })
      }
    }

    // Remove team member
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error removing team member:', error)
    const { response, status } = createApiError('INTERNAL_ERROR', {
      errorMessage: error.message,
    })
    return NextResponse.json(response, { status })
  }
}
