import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    console.log('[v0] Logout request received')
    
    const supabase = await createServerSupabaseClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('[v0] Logout error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log('[v0] Logout successful')
    return NextResponse.json({ message: 'Logged out successfully' })
  } catch (error) {
    console.error('[v0] Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
