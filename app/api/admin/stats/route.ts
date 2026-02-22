import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

async function verifyAdminSimple(supabase: any) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  
  const { data } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
  return data?.is_admin ? user : null
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const isAdmin = await verifyAdminSimple(supabase)

    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    // Get active missions
    const { count: activeMissions } = await supabase
      .from('missions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    // Get pending exchanges
    const { count: pendingExchanges } = await supabase
      .from('exchange_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    // Get total ZeryT distributed
    const { data: zerytData } = await supabase
      .from('users')
      .select('zeryt_balance')

    const zerytDistributed = zerytData?.reduce((sum, u) => sum + (u.zeryt_balance || 0), 0) || 0

    // Calculate growth percentage (simplified)
    const userGrowth = 5

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      userGrowth,
      activeMissions: activeMissions || 0,
      pendingExchanges: pendingExchanges || 0,
      zerytDistributed,
      zerytInUSD: Math.round(zerytDistributed * 0.05),
      newReferrals: 0,
      totalReferrals: 0,
    })
  } catch (error) {
    console.error('[v0] Get stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
