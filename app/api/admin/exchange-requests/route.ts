import { checkAdminAccess } from '@/lib/admin-check'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    if (!await checkAdminAccess()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()

    // Get exchange requests
    const { data: exchanges, error: exchangeError } = await supabase
      .from('exchange_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (exchangeError) {
      console.error('[v0] Exchange requests query error:', exchangeError)
      return NextResponse.json(
        { error: exchangeError.message },
        { status: 400 }
      )
    }

    // Get all user IDs from exchanges
    const userIds = [...new Set(exchanges?.map((e) => e.user_id) || [])]

    if (userIds.length === 0) {
      return NextResponse.json([])
    }

    // Get user info for all these IDs
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, username, email')
      .in('id', userIds)

    if (userError) {
      console.error('[v0] Users query error:', userError)
      // Continue without user info if it fails
    }

    // Create a map of user info
    const userMap = new Map(
      users?.map((u) => [u.id, { username: u.username, email: u.email }]) || []
    )

    // Merge user info with exchanges
    const formattedExchanges =
      exchanges?.map((e) => {
        const userInfo = userMap.get(e.user_id) || {}
        return {
          ...e,
          username: userInfo.username || userInfo.email || 'Unknown User',
          user_email: userInfo.email || '',
        }
      }) || []

    return NextResponse.json(formattedExchanges)
  } catch (error) {
    console.error('[v0] Get exchanges error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
