import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    // Get count of approved submissions per mission
    const { data: counts, error } = await supabase
      .from('mission_submissions')
      .select('mission_id, id')
      .eq('status', 'approved')

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // Count by mission_id
    const completionCounts: { [key: string]: number } = {}
    counts?.forEach((submission) => {
      completionCounts[submission.mission_id] = (completionCounts[submission.mission_id] || 0) + 1
    })

    return NextResponse.json(completionCounts)
  } catch (error) {
    console.error('[v0] Get completion count error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
