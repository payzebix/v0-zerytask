import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { id } = params

    // Validate ID is a valid UUID (36 characters with hyphens)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid profile ID format' },
        { status: 400 }
      )
    }

    const { data: profile, error } = await supabase
      .from('mission_profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('[v0] Mission profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { id } = params

    // Validate ID is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid profile ID format' },
        { status: 400 }
      )
    }

    const body = await request.json()

    const { name, description, logo_url, website_url, status } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Profile name is required' },
        { status: 400 }
      )
    }

    const { data: updated, error } = await supabase
      .from('mission_profiles')
      .update({
        name,
        description,
        logo_url,
        website_url,
        status: status || 'active',
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[v0] Update error:', error)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 400 }
      )
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[v0] Mission profile PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
