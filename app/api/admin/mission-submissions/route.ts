import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!userData?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch submissions without joins (relationships may not exist)
    const { data: submissions, error } = await supabase
      .from('mission_submissions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] Error fetching submissions:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Safely handle submissions as array
    const submissionsArray = Array.isArray(submissions) ? submissions : []

    if (submissionsArray.length === 0) {
      return NextResponse.json([])
    }

    // Fetch mission and user data for all submissions
    const missionIds = [...new Set(submissionsArray.map((s) => s.mission_id))]
    const userIds = [...new Set(submissionsArray.map((s) => s.user_id))]

    const { data: missions } = await supabase
      .from('missions')
      .select('id, title, xp_reward, zeryt_reward')
      .in('id', missionIds)

    const { data: users } = await supabase
      .from('users')
      .select('id, username, email, avatar_url')
      .in('id', userIds)

    // Create lookup maps
    const missionMap = new Map(missions?.map((m) => [m.id, m]) || [])
    const userMap = new Map(users?.map((u) => [u.id, u]) || [])

    // Enrich submissions with mission and user data
    const enrichedSubmissions = submissionsArray.map((submission) => ({
      ...submission,
      mission: missionMap.get(submission.mission_id),
      user: userMap.get(submission.user_id),
      submission_images: submission.submission_image 
        ? [submission.submission_image] 
        : (submission.submission_images || []),
    }))

    return NextResponse.json(enrichedSubmissions)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
