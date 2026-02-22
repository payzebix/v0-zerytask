import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('admin_config')
      .select('referral_xp_reward, referral_zeryt_reward, referral_usdc_reward, referral_min_level, referral_min_missions')
      .limit(1)
      .single()

    if (error) {
      // Return defaults if not set
      return NextResponse.json({
        referral_xp_reward: 5000,
        referral_zeryt_reward: 250,
        referral_usdc_reward: 50,
        referral_min_level: 3,
        referral_min_missions: 5,
      })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[v0] Get referral config error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
