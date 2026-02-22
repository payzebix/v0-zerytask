import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const updates = await request.json()

    // Only allow certain fields to be updated
    const allowedFields = ['username', 'wallet_address', 'twitter_handle', 'avatar_url']
    const sanitizedUpdates: Record<string, string> = {}

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        sanitizedUpdates[key] = value as string
      }
    }

    const { data, error } = await supabase
      .from('users')
      .update(sanitizedUpdates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[v0] Update user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
