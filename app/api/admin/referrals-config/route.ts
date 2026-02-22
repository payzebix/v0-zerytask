import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (userError || !userData?.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const {
      referral_xp_reward,
      referral_zeryt_reward,
      referral_usdc_reward,
      referral_min_level,
      referral_min_missions,
    } = await request.json()

    // Get existing config or create one
    const { data: existingConfig, error: fetchError } = await supabase
      .from('admin_config')
      .select('id')
      .limit(1)

    if (fetchError) {
      return NextResponse.json(
        { error: fetchError.message },
        { status: 400 }
      )
    }

    let configId = existingConfig?.[0]?.id

    // If no config exists, create one
    if (!configId) {
      const { data: newConfig, error: createError } = await supabase
        .from('admin_config')
        .insert({
          referral_xp_reward,
          referral_zeryt_reward,
          referral_usdc_reward,
          referral_min_level,
          referral_min_missions,
        })
        .select()
        .single()

      if (createError) {
        return NextResponse.json(
          { error: createError.message },
          { status: 400 }
        )
      }

      return NextResponse.json(newConfig)
    }

    // Update existing config
    const { data: updatedConfig, error: updateError } = await supabase
      .from('admin_config')
      .update({
        referral_xp_reward,
        referral_zeryt_reward,
        referral_usdc_reward,
        referral_min_level,
        referral_min_missions,
        updated_at: new Date().toISOString(),
      })
      .eq('id', configId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      )
    }

    return NextResponse.json(updatedConfig)
  } catch (error) {
    console.error('[v0] Update referral config error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
