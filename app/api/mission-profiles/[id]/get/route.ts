import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const { data, error } = await supabase
      .from('mission_profiles')
      .select('id, name, description, logo_url')
      .eq('id', params.id)
      .maybeSingle()

    if (error) {
      console.error('[v0] Error fetching mission profile:', error)
      return NextResponse.json(
        { error: 'Error fetching profile', details: error.message },
        { status: 500 }
      )
    }

    if (!data) {
      console.log('[v0] Profile not found for ID:', params.id)
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    console.log('[v0] Fetched profile:', data.id, data.name)
    return NextResponse.json(data)
  } catch (error) {
    console.error('[v0] Mission profile GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
