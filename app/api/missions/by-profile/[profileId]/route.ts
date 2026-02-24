import { createServerClient } from '@supabase/ssr'
import { isValidUUID, invalidUUIDResponse } from '@/lib/uuid-validator'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { profileId: string } }
) {
  try {
    // Validate profile ID is a valid UUID
    if (!isValidUUID(params.profileId)) {
      const response = invalidUUIDResponse('Profile ID')
      return NextResponse.json(
        { error: response.error },
        { status: response.status }
      )
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Handle cookie setting errors
            }
          },
        },
      }
    )

    console.log('[v0] Fetching missions for profile:', params.profileId)

    const { data, error } = await supabase
      .from('missions')
      .select('*')
      .eq('mission_profile_id', params.profileId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] Error fetching missions by profile:', error)
      return NextResponse.json(
        { error: 'Error fetching missions', details: error.message },
        { status: 500 }
      )
    }

    console.log('[v0] Found missions:', data?.length || 0, 'for profile:', params.profileId)

    // Enrich missions with social network logos if available
    const enrichedMissions = await Promise.all(
      (data || []).map(async (mission: any) => {
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
          console.log('[v0] Could not enrich mission with social network:', err)
        }
        return mission
      })
    )

    return NextResponse.json(enrichedMissions || [])
  } catch (error) {
    console.error('[v0] Missions by profile GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
