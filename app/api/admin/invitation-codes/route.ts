import { getAdminSupabaseClient } from '@/lib/supabase-admin'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { generateInvitationCode } from '@/lib/code-generator'

// Force rebuild: 2025-02-24T12:00:00Z
export async function GET(request: Request) {
  try {
    // Use regular client to verify current user
    const supabaseAuth = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData } = await supabaseAuth
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!userData?.is_admin) {
      return Response.json({ error: 'Forbidden: Only admins can access this' }, { status: 403 })
    }

    // Use admin client to fetch codes
    const supabase = getAdminSupabaseClient()
    const { data, error } = await supabase
      .from('invitation_codes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return Response.json(data)
  } catch (error) {
    console.error('[v0] Error fetching invitation codes:', error)
    return Response.json({ error: 'Failed to fetch invitation codes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Use regular client to verify current user
    const supabaseAuth = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData } = await supabaseAuth
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!userData?.is_admin) {
      return Response.json({ error: 'Forbidden: Only admins can create codes' }, { status: 403 })
    }

    // Use admin client for creating codes
    const supabase = getAdminSupabaseClient()

    const { quantity, expires_in_days } = await request.json()

    // Generate invitation codes (8 alphanumeric characters each)
    const codes = []
    const expiresAt = expires_in_days
      ? new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000).toISOString()
      : null

    for (let i = 0; i < (quantity || 1); i++) {
      codes.push({
        code: generateInvitationCode(),
        created_by: user.id,
        expires_at: expiresAt,
        status: 'active',
      })
    }

    // Insert codes into database
    const { data, error } = await supabase.from('invitation_codes').insert(codes).select()

    if (error) throw error

    return Response.json(
      {
        message: `Created ${codes.length} invitation code(s)`,
        codes: data,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[v0] Error creating invitation codes:', error)
    return Response.json({ error: 'Failed to create invitation codes' }, { status: 500 })
  }
}
