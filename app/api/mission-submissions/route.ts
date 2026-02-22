import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getAdminSupabaseClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      mission_id,
      submission_proof,
      submission_url,
    } = body

    if (!mission_id) {
      return NextResponse.json(
        { error: 'Mission ID is required' },
        { status: 400 }
      )
    }

    // Verify user hasn't already submitted for this mission
    const { data: existingSubmissions } = await supabase
      .from('mission_submissions')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('mission_id', mission_id)

    if (existingSubmissions && existingSubmissions.length > 0) {
      const hasApprovedOrPending = existingSubmissions.some(
        (sub: any) => sub.status === 'approved' || sub.status === 'pending'
      )
      
      if (hasApprovedOrPending) {
        return NextResponse.json(
          { 
            error: 'You already submitted for this mission. Please wait for admin approval or contact support.' 
          },
          { status: 400 }
        )
      }
    }

    // Combine proof and url for submission_proof field
    const proof = submission_proof || submission_url || ''

    const adminSupabase = getAdminSupabaseClient()
    const { data: submission, error } = await adminSupabase
      .from('mission_submissions')
      .insert({
        user_id: user.id,
        mission_id,
        submission_proof: proof,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('[v0] Error creating submission:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(submission, { status: 201 })
  } catch (error) {
    console.error('[v0] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's submissions
    const { data: submissions, error } = await supabase
      .from('mission_submissions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] Error fetching submissions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(submissions)
  } catch (error) {
    console.error('[v0] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
