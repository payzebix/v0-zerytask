import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

/**
 * GET /api/admin/check
 * Returns whether the current user is an admin
 * Used for client-side admin verification
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ isAdmin: false })
    }

    const { data: userData, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('[v0] Error checking admin status:', error)
      return NextResponse.json({ isAdmin: false })
    }

    return NextResponse.json({ isAdmin: userData?.is_admin === true })
  } catch (error) {
    console.error('[v0] Admin check error:', error)
    return NextResponse.json({ isAdmin: false })
  }
}
