import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { generateInvitationCode } from '@/lib/code-generator'

export async function GET(request: Request) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookies().getAll()
        },
        setAll() {},
      },
    }
  )

  try {
    // Get current user to verify admin status
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!userData?.is_admin) {
      return Response.json({ error: 'Forbidden: Only admins can access this' }, { status: 403 })
    }

    // Get all invitation codes
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
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookies().getAll()
        },
        setAll() {},
      },
    }
  )

  try {
    const { quantity, expires_in_days } = await request.json()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .eq('is_admin', true)
      .single()

    if (!userData) {
      return Response.json({ error: 'Forbidden: Only admins can create codes' }, { status: 403 })
    }

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
