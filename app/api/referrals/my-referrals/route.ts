import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
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

    // Get referrals
    const { data: referrals, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] Get referrals error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // Get user details for each referral
    const enrichedReferrals = await Promise.all(
      (referrals || []).map(async (ref: any) => {
        // Try both column names since schema might have referred_user_id instead
        const userId = ref.referred_user_id || ref.referral_user_id
        
        const { data: referredUser } = await supabase
          .from('users')
          .select('id, username, email, current_level')
          .eq('id', userId)
          .maybeSingle()

        // Count missions completed by this user
        const { count: missionsCount } = await supabase
          .from('mission_submissions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('status', 'verified')

        return {
          id: ref.id,
          referrer_id: ref.referrer_id,
          referred_user_id: userId,
          status: ref.status,
          created_at: ref.created_at,
          code_used: null,
          username: referredUser?.username || null,
          email: referredUser?.email || null,
          current_level: referredUser?.current_level || 0,
          missions_completed: missionsCount || 0,
          referral_earnings_zeryt: 0,
        }
      })
    )

    return NextResponse.json(enrichedReferrals)
  } catch (error) {
    console.error('[v0] Get referrals error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
