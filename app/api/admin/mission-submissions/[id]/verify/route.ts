import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getLevelFromXp } from '@/lib/level-system'

export async function POST(
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
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
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

    const body = await request.json()
    const { approved, admin_notes } = body

    const status = approved ? 'approved' : 'rejected'

    // Get submission details including mission info
    const { data: submission } = await supabase
      .from('mission_submissions')
      .select('user_id, mission_id')
      .eq('id', params.id)
      .single()

    if (!submission) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Update submission status
    const { data: updated, error } = await supabase
      .from('mission_submissions')
      .update({
        status,
        admin_notes: admin_notes || null,
        verified_by: user.id,
        verified_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // If approved, award rewards to user
    if (approved) {
      const { data: mission } = await supabase
        .from('missions')
        .select('xp_reward, zeryt_reward')
        .eq('id', submission.mission_id)
        .single()

      if (mission) {
        const { data: userBalance } = await supabase
          .from('users')
          .select('xp_balance, zeryt_balance, current_level')
          .eq('id', submission.user_id)
          .single()

        if (userBalance) {
          const newXpBalance = (userBalance.xp_balance || 0) + (mission.xp_reward || 0)
          const newLevel = getLevelFromXp(newXpBalance)

          await supabase
            .from('users')
            .update({
              xp_balance: newXpBalance,
              zeryt_balance: (userBalance.zeryt_balance || 0) + (mission.zeryt_reward || 0),
              current_level: newLevel,
            })
            .eq('id', submission.user_id)
        }
      }
    }

    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
