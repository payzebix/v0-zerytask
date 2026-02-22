import { checkAdminAccess } from '@/lib/admin-check'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('[v0] Admin missions GET started')
    
    if (!await checkAdminAccess()) {
      console.log('[v0] Admin access denied')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()

    const { data: missions, error } = await supabase
      .from('missions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] Error fetching missions:', error.message, 'code:', error.code)
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      )
    }

    console.log('[v0] Admin missions fetched:', missions?.length || 0)
    return NextResponse.json(missions)
  } catch (error) {
    console.error('[v0] Get admin missions error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    console.log('[v0] Admin missions POST started')
    
    if (!await checkAdminAccess()) {
      console.log('[v0] Admin access denied')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[v0] Admin verified, using service role client')
    
    const { createServiceRoleClient } = await import('@/lib/supabase-service-role')
    const supabase = createServiceRoleClient()
    const body = await request.json()

    // Extract only known fields from body to prevent constraint violations
    const {
      title,
      description,
      brief,
      mission_profile_id,
      mission_type_id,
      social_network_id,
      website_url,
      verification_type,
      xp_reward,
      zeryt_reward,
      priority,
      status,
      category,
      image_url,
      recurrence,
      max_completions,
      start_date,
      end_date,
      schedule_start_time,
      schedule_end_time,
      time_limited,
    } = body
    
    // Ignore any extra fields that are not in the schema

    if (!title || !mission_profile_id || !mission_type_id) {
      return NextResponse.json(
        { error: 'Title, profile, and type are required' },
        { status: 400 }
      )
    }

    const { data: mission, error } = await supabase
      .from('missions')
      .insert({
        title,
        description,
        brief,
        mission_profile_id,
        mission_type_id,
        social_network_id,
        website_url,
        verification_type: 'manual', // Always use 'manual' in missions table - specific types go to mission_verifications
        xp_reward: xp_reward || 0,
        zeryt_reward: zeryt_reward || 0,
        priority: priority || 'normal',
        status: status || 'active',
        category: category || null,
        image_url: image_url || null,
        recurrence: recurrence || 'once',
        max_completions: max_completions || 0,
        start_date: start_date || new Date().toISOString().split('T')[0],
        end_date: end_date || null,
        schedule_start_time: schedule_start_time || '00:00',
        schedule_end_time: schedule_end_time || '23:59',
        time_limited: time_limited || false,
      })
      .select()
      .single()

    if (error) {
      console.error('[v0] Error inserting mission:', error.message, 'Code:', error.code)
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      )
    }

    console.log('[v0] Mission created:', mission?.id)

    // If a specific verification type is provided, save it to mission_verifications table
    if (verification_type && mission?.id && verification_type !== 'manual') {
      const { error: verificationError } = await supabase
        .from('mission_verifications')
        .insert({
          mission_id: mission.id,
          verification_type: verification_type,
        })
      
      if (verificationError) {
        console.error('[v0] Error saving verification:', verificationError)
      }
    }

    return NextResponse.json(mission, { status: 201 })
  } catch (error) {
    console.error('[v0] Create mission error:', error)
    return NextResponse.json(
      { error: 'Failed to create mission' },
      { status: 500 }
    )
  }
}
