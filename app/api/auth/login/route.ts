import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // Check maintenance mode (safely handle if table is empty or doesn't exist)
    const { data: settings } = await supabase
      .from('app_settings')
      .select('maintenance_mode, maintenance_message')
      .maybeSingle()

    // Allow login only if: not in maintenance mode OR user is admin
    if (settings?.maintenance_mode) {
      const { data: userData } = await supabase
        .from('users')
        .select('is_admin')
        .eq('email', email)
        .maybeSingle()

      if (!userData?.is_admin) {
        return NextResponse.json(
          { 
            error: 'maintenance_mode',
            message: settings?.maintenance_message || 'System under maintenance'
          },
          { status: 503 }
        )
      }
    }

    console.log('[v0] Attempting sign-in for:', email)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('[v0] Sign-in error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    if (!data.session) {
      console.error('[v0] No session returned after sign-in')
      return NextResponse.json({ error: 'No session created' }, { status: 401 })
    }

    console.log('[v0] Sign-in successful for user:', data.user?.id)

    const response = NextResponse.json(
      { message: 'Login successful', user: data.user, session: data.session },
      { status: 200 }
    )

    // Session cookies are automatically set by Supabase, but ensure they're persisted
    return response
  } catch (error) {
    console.error('[v0] Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
