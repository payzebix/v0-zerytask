import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse, NextRequest } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params - Next.js 16 requirement
    const { id } = await params

    const supabase = await createServerSupabaseClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if admin
    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!userData?.is_admin) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    const missionId = id
    const body = await request.json()

    const { data: verification, error } = await supabase
      .from('mission_verifications')
      .insert({
        mission_id: missionId,
        verification_type: body.verification_type,
        text_label: body.text_label,
        text_example: body.text_example,
        image_example_url: body.image_example_url,
        link_domain: body.link_domain,
        link_description: body.link_description,
      })
      .select()
      .single()

    if (error) {
      console.error('[v0] Error creating verification:', error)
      return NextResponse.json(
        { error: 'Failed to create verification' },
        { status: 400 }
      )
    }

    return NextResponse.json({ verification }, { status: 201 })
  } catch (error) {
    console.error('[v0] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params - Next.js 16 requirement
    const { id } = await params

    const supabase = await createServerSupabaseClient()
    
    const missionId = id

    const { data: verifications, error } = await supabase
      .from('mission_verifications')
      .select('*')
      .eq('mission_id', missionId)

    if (error) {
      console.error('[v0] Error fetching verifications:', error)
      return NextResponse.json(
        { error: 'Failed to fetch verifications' },
        { status: 400 }
      )
    }

    return NextResponse.json({ verifications })
  } catch (error) {
    console.error('[v0] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
