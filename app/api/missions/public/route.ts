import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Create anon client for public access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: Request) {
  try {
    console.log('[v0] Fetching public missions')

    // Get missions - RLS will filter by status automatically
    const { data: missions, error } = await supabase
      .from('missions')
      .select(`
        id,
        title,
        description,
        brief,
        image_url,
        xp_reward,
        zeryt_reward,
        category,
        mission_profile_id,
        status,
        verification_type,
        created_at,
        mission_profiles (
          id,
          name,
          logo_url,
          description
        ),
        social_networks (
          id,
          name,
          icon_url
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] Error fetching public missions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch missions', details: error.message },
        { status: 500 }
      )
    }

    console.log('[v0] Public missions found:', missions?.length || 0)
    
    // Return as array directly, not wrapped
    if (Array.isArray(missions)) {
      return NextResponse.json(missions, { status: 200 })
    }
    
    return NextResponse.json([], { status: 200 })
  } catch (error) {
    console.error('[v0] Public missions endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
