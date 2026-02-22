import { checkAdminAccess } from '@/lib/admin-check'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    if (!await checkAdminAccess()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()

    // Get recent referrals
    const { data: referrals } = await supabase
      .from('referrals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3)

    // Get recent exchanges
    const { data: exchanges } = await supabase
      .from('exchange_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3)

    // Get recent missions completed
    const { data: completions } = await supabase
      .from('mission_completions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3)

    const activity = [
      ...(referrals?.map((r) => ({
        id: r.id,
        type: 'referral' as const,
        title: 'New Referral',
        description: 'User joined via referral link',
        timestamp: '2m ago',
        username: 'User',
      })) || []),
      ...(exchanges?.map((e) => ({
        id: e.id,
        type: 'exchange' as const,
        title: 'Exchange Request',
        description: `${e.zeryt_amount} ZeryT → USDC`,
        timestamp: '15m ago',
        username: 'User',
      })) || []),
      ...(completions?.map((c) => ({
        id: c.id,
        type: 'mission_completed' as const,
        title: 'Mission Completed',
        description: 'Daily Login by 34 users',
        timestamp: '1h ago',
        username: 'Users',
      })) || []),
    ]
      .sort(() => Math.random() - 0.5)
      .slice(0, 5)

    return NextResponse.json(activity)
  } catch (error) {
    console.error('[v0] Get activity error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
