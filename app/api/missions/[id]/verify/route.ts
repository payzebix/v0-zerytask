import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse, NextRequest } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const missionId = params.id
    const body = await request.json()
    const { verification_type, submitted_data } = body

    // Get mission verifications for this mission
    const { data: verifications } = await supabase
      .from('mission_verifications')
      .select('*')
      .eq('mission_id', missionId)

    if (!verifications || verifications.length === 0) {
      return NextResponse.json(
        { error: 'No verifications found for this mission' },
        { status: 404 }
      )
    }

    // Get or create mission submission
    const { data: existingSubmission } = await supabase
      .from('mission_submissions')
      .select('id')
      .eq('mission_id', missionId)
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .maybeSingle()

    if (existingSubmission) {
      return NextResponse.json(
        { error: 'Mission already completed' },
        { status: 400 }
      )
    }

    // Handle each verification type
    const verification = verifications.find(v => v.verification_type === verification_type)
    
    if (!verification) {
      return NextResponse.json(
        { error: `Verification type ${verification_type} not configured for this mission` },
        { status: 400 }
      )
    }

    // Create mission submission
    const { data: submission, error: submissionError } = await supabase
      .from('mission_submissions')
      .insert({
        mission_id: missionId,
        user_id: user.id,
        verification_data: submitted_data,
        status: 'completed',
      })
      .select()
      .single()

    if (submissionError) {
      console.error('[v0] Error creating submission:', submissionError)
      return NextResponse.json(
        { error: 'Failed to create submission' },
        { status: 400 }
      )
    }

    // For automatic verification, mark as verified immediately
    if (verification_type === 'automatic') {
      console.log('[v0] Processing automatic verification for mission:', missionId)

      const { error: updateError } = await supabase
        .from('mission_submissions')
        .update({
          verified_at: new Date().toISOString(),
          verified_by: user.id,
          status: 'verified',
        })
        .eq('id', submission.id)

      if (updateError) {
        console.error('[v0] Error verifying automatic submission:', updateError)
        return NextResponse.json(
          { error: 'Failed to verify submission' },
          { status: 400 }
        )
      }

      // Award XP and Zeryt immediately
      const { data: mission, error: missionError } = await supabase
        .from('missions')
        .select('xp_reward, zeryt_reward')
        .eq('id', missionId)
        .single()

      if (missionError) {
        console.error('[v0] Error fetching mission:', missionError)
      } else if (mission) {
        // Update user rewards directly
        const { data: userBalance } = await supabase
          .from('users')
          .select('xp_balance, zeryt_balance, current_level')
          .eq('id', user.id)
          .single()

        if (userBalance) {
          const { getLevelFromXp } = await import('@/lib/level-system')
          const newXpBalance = (userBalance.xp_balance || 0) + (mission.xp_reward || 0)
          const newLevel = getLevelFromXp(newXpBalance)

          const { error: updateRewardsError } = await supabase
            .from('users')
            .update({
              xp_balance: newXpBalance,
              zeryt_balance: (userBalance.zeryt_balance || 0) + (mission.zeryt_reward || 0),
              current_level: newLevel,
            })
            .eq('id', user.id)

          if (updateRewardsError) {
            console.error('[v0] Error updating user rewards:', updateRewardsError)
          } else {
            console.log('[v0] Rewards awarded - XP:', mission.xp_reward, 'Zeryt:', mission.zeryt_reward)
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Mission completed automatically',
        submission: submission,
      })
    }

    // For manual verifications, create pending verification record
    if (['text', 'image', 'link'].includes(verification_type)) {
      // Validate domain for link verification
      if (verification_type === 'link' && verification.link_domain) {
        const submittedLink = submitted_data.link || ''
        try {
          const url = new URL(submittedLink)
          const domain = url.hostname
          if (!domain.includes(verification.link_domain)) {
            return NextResponse.json(
              { error: `Link must be from domain: ${verification.link_domain}` },
              { status: 400 }
            )
          }
        } catch (e) {
          return NextResponse.json(
            { error: 'Invalid link URL format' },
            { status: 400 }
          )
        }
      }

      const { error: pendingError } = await supabase
        .from('mission_verifications_pending')
        .insert({
          mission_submission_id: submission.id,
          mission_id: missionId,
          user_id: user.id,
          verification_type: verification_type,
          submitted_text: verification_type === 'text' ? submitted_data.text : null,
          submitted_link: verification_type === 'link' ? submitted_data.link : null,
          submitted_image_url: verification_type === 'image' ? submitted_data.image_url : null,
          status: 'pending',
        })

      if (pendingError) {
        console.error('[v0] Error creating pending verification:', pendingError)
        return NextResponse.json(
          { error: 'Failed to create verification submission' },
          { status: 400 }
        )
      }

      console.log('[v0] Pending verification created for mission:', missionId, 'user:', user.id)

      return NextResponse.json({
        success: true,
        message: 'Verification submitted. Awaiting admin approval.',
        submission: submission,
        pending: true,
      })
    }

    return NextResponse.json({
      success: true,
      submission: submission,
    })
  } catch (error) {
    console.error('[v0] Verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
