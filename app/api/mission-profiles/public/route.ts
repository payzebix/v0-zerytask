import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Create anon client for public access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: Request) {
  try {
    console.log('[v0] Fetching public mission profiles')

    // Get only active profiles without requiring authentication
    const { data: profiles, error } = await supabase
      .from('mission_profiles')
      .select(`
        id,
        name,
        description,
        logo_url,
        website_url,
        status,
        created_at,
        updated_at
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] Error fetching public profiles:', error)
      return NextResponse.json(
        { error: 'Failed to fetch profiles', details: error.message },
        { status: 500 }
      )
    }

    console.log('[v0] Public profiles found:', profiles?.length || 0)

    return NextResponse.json(profiles || [], { status: 200 })
  } catch (error) {
    console.error('[v0] Public profiles endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
