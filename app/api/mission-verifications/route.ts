import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const mission_id = searchParams.get('mission_id')

    if (!mission_id) {
      return NextResponse.json(
        { error: 'mission_id is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('mission_verifications')
      .select('*')
      .eq('mission_id', mission_id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(data || [], { status: 200 })
  } catch (error) {
    console.error('[v0] Get mission verifications error:', error)
    return NextResponse.json(
      { error: 'Failed to get mission verifications' },
      { status: 500 }
    )
  }
}
