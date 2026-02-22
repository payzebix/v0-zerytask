import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    console.log('[v0] Missions GET request, category:', category)

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    // If user is authenticated, return all missions they have access to
    if (user && !authError) {
      console.log('[v0] Authenticated user:', user.id)

      // Try to fetch all missions (RLS will filter based on status)
      const { data: missions, error } = await supabase
        .from('missions')
        .select('*')
        .or('status.eq.active,status.is.null')  // Explicitly filter by RLS policy rules
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[v0] Error fetching authenticated missions:', error.message, 'Code:', error.code, 'Details:', error.details)
        // Fall through to public endpoint
      } else if (missions && missions.length > 0) {
        console.log('[v0] Returning authenticated missions:', missions.length)
        console.log('[v0] Sample mission:', JSON.stringify(missions[0]))

        // Enrich missions with social network logos
        const enrichedMissions = await Promise.all(
          (missions || []).map(async (mission: any) => {
            try {
              if (mission.social_network_id) {
                const { data: socialNetwork } = await supabase
                  .from('social_networks')
                  .select('icon_url, name')
                  .eq('id', mission.social_network_id)
                  .single()

                return {
                  ...mission,
                  icon_url: socialNetwork?.icon_url || mission.image_url,
                }
              }
            } catch (err) {
              console.log('[v0] Could not enrich mission with social network')
            }
            return mission
          })
        )

        return NextResponse.json(enrichedMissions)
      }
    }

    console.log('[v0] No authenticated user or error, falling back to public missions')

    // Fallback: Get public missions (no auth required)
    const publicResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/missions/public`,
      { cache: 'no-store' }
    )

    if (!publicResponse.ok) {
      console.error('[v0] Public missions fallback failed:', publicResponse.status)
      return NextResponse.json(
        { error: 'Failed to fetch missions' },
        { status: 500 }
      )
    }

    const publicMissions = await publicResponse.json()
    console.log('[v0] Returning public missions:', publicMissions.length || 0)

    return NextResponse.json(publicMissions)
  } catch (error) {
    console.error('[v0] Get missions error:', error)
    
    // Last resort: try to fetch public missions
    try {
      const fallbackResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/missions/public`,
        { cache: 'no-store' }
      )
      
      if (fallbackResponse.ok) {
        const missions = await fallbackResponse.json()
        console.log('[v0] Used fallback public missions:', missions.length)
        return NextResponse.json(missions)
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
