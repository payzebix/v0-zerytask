import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    console.log('[v0] Fetching mission profiles')

    // Try to fetch authenticated profiles first
    const { data: profiles, error } = await supabase
      .from('mission_profiles')
      .select('*')
      .order('created_at', { ascending: false })

    console.log('[v0] Fetched profiles:', profiles?.length || 0, 'Error:', error?.message)

    if (profiles && profiles.length > 0) {
      // Calculate total rewards for each profile
      const profilesWithRewards = await Promise.all(
        profiles.map(async (profile) => {
          try {
            const { data: missions } = await supabase
              .from('missions')
              .select('xp_reward, zeryt_reward')
              .eq('mission_profile_id', profile.id)

            const totalXP = missions?.reduce((sum, m) => sum + (m.xp_reward || 0), 0) || 0
            const totalZeryT = missions?.reduce((sum, m) => sum + (m.zeryt_reward || 0), 0) || 0

            return {
              ...profile,
              total_xp_reward: totalXP,
              total_zeryt_reward: totalZeryT,
            }
          } catch (err) {
            console.log('[v0] Could not calculate rewards for profile:', profile.id)
            return profile
          }
        })
      )

      return NextResponse.json(profilesWithRewards)
    }

    console.log('[v0] No authenticated profiles found, trying public endpoint')

    // Fallback to public profiles
    const publicResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/mission-profiles/public`,
      { cache: 'no-store' }
    )

    if (publicResponse.ok) {
      const publicProfiles = await publicResponse.json()
      console.log('[v0] Returning public profiles:', publicProfiles.length)
      return NextResponse.json(publicProfiles)
    }

    console.error('[v0] Error fetching profiles:', error)
    return NextResponse.json(
      { error: 'Error fetching profiles', details: error?.message },
      { status: 500 }
    )
  } catch (error) {
    console.error('[v0] Mission profiles error:', error)
    
    // Last resort fallback
    try {
      const fallbackResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/mission-profiles/public`,
        { cache: 'no-store' }
      )
      
      if (fallbackResponse.ok) {
        const profiles = await fallbackResponse.json()
        console.log('[v0] Used fallback public profiles')
        return NextResponse.json(profiles)
      }
    } catch (fallbackError) {
      console.error('[v0] Fallback also failed:', fallbackError)
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
