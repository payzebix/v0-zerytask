import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse, NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
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
      console.log('[v0] Non-admin user attempted to access verifications:', user.id)
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    console.log('[v0] Admin fetching pending verifications')

    // Get pending verifications with user and mission info
    const { data: pending, error: fetchError } = await supabase
      .from('mission_verifications_pending')
      .select(`
        *,
        user:users(id, username, email),
        mission:missions(id, title)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('[v0] Error fetching pending verifications:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch verifications', details: fetchError.message },
        { status: 500 }
      )
    }

    console.log('[v0] Found pending verifications:', pending?.length || 0)
    return NextResponse.json({ verifications: pending || [] })
  } catch (error) {
    console.error('[v0] Error fetching pending verifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
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

    const body = await request.json()
    const { verification_id, approved, notes } = body

    console.log('[v0] Admin processing verification:', verification_id, 'approved:', approved)

    if (!verification_id) {
      return NextResponse.json(
        { error: 'verification_id is required' },
        { status: 400 }
      )
    }

    // Get the pending verification
    const { data: pendingVerification, error: fetchError } = await supabase
      .from('mission_verifications_pending')
      .select('*')
      .eq('id', verification_id)
      .single()

    if (fetchError) {
      console.error('[v0] Error fetching verification:', fetchError)
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      )
    }

    if (!pendingVerification) {
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      )
    }

    // Update pending verification status
    const status = approved ? 'approved' : 'rejected'
    const { error: updateError, data: updatedVerification } = await supabase
      .from('mission_verifications_pending')
      .update({
        status: status,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        admin_notes: notes || null,
      })
      .eq('id', verification_id)
      .select()
      .single()

    if (updateError) {
      console.error('[v0] Error updating verification:', updateError)
      return NextResponse.json(
        { error: 'Failed to update verification' },
        { status: 400 }
      )
    }

    console.log('[v0] Verification status updated to:', status)

    // If approved, update submission and award rewards
    if (approved) {
      const { error: submissionError } = await supabase
        .from('mission_submissions')
        .update({
          verified_at: new Date().toISOString(),
          verified_by: user.id,
          status: 'verified',
        })
        .eq('id', pendingVerification.mission_submission_id)

      if (submissionError) {
        console.error('[v0] Error updating submission:', submissionError)
        return NextResponse.json(
          { error: 'Failed to update submission status' },
          { status: 400 }
        )
      }

      // Get mission rewards
      const { data: mission, error: missionError } = await supabase
        .from('missions')
        .select('xp_reward, zeryt_reward')
        .eq('id', pendingVerification.mission_id)
        .single()

      if (missionError) {
        console.error('[v0] Error fetching mission:', missionError)
      } else if (mission) {
        // Award XP and Zeryt directly
        const { data: userBalance } = await supabase
          .from('users')
          .select('xp_balance, zeryt_balance, current_level')
          .eq('id', pendingVerification.user_id)
          .single()

        if (userBalance) {
          const { getLevelFromXp } = await import('@/lib/level-system')
          const newXpBalance = (userBalance.xp_balance || 0) + (mission.xp_reward || 0)
          const newLevel = getLevelFromXp(newXpBalance)

          const { error: rewardError } = await supabase
            .from('users')
            .update({
              xp_balance: newXpBalance,
              zeryt_balance: (userBalance.zeryt_balance || 0) + (mission.zeryt_reward || 0),
              current_level: newLevel,
            })
            .eq('id', pendingVerification.user_id)

          if (rewardError) {
            console.error('[v0] Error awarding rewards:', rewardError)
          } else {
            console.log('[v0] Rewards awarded - XP:', mission.xp_reward, 'Zeryt:', mission.zeryt_reward)
          }
        }
      }
    } else {
      // If rejected, update submission status
      const { error: submissionError } = await supabase
        .from('mission_submissions')
        .update({
          status: 'rejected',
          verified_by: user.id,
          verified_at: new Date().toISOString(),
        })
        .eq('id', pendingVerification.mission_submission_id)

      if (submissionError) {
        console.error('[v0] Error updating submission status:', submissionError)
      } else {
        console.log('[v0] Submission rejected')
      }
    }

    return NextResponse.json({
      success: true,
      message: `Verification ${status}`,
      verification: updatedVerification,
    })
  } catch (error) {
    console.error('[v0] Error processing verification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
