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

    const { zeryt_exchange_rate, min_withdrawal_amount } = await request.json()

    if (zeryt_exchange_rate === undefined || min_withdrawal_amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

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
          zeryt_exchange_rate: Number(zeryt_exchange_rate),
          min_withdrawal_amount: Number(min_withdrawal_amount),
        })
        .select()

      if (createError) {
        return NextResponse.json(
          { error: createError.message },
          { status: 400 }
        )
      }

      if (!newConfig || newConfig.length === 0) {
        return NextResponse.json(
          { error: 'Failed to create config' },
          { status: 400 }
        )
      }

      const config = newConfig[0]
      return NextResponse.json({
        id: config.id,
        zeryt_exchange_rate: Number(config.zeryt_exchange_rate),
        min_withdrawal_amount: Number(config.min_withdrawal_amount),
      })
    }

    // Update existing config
    const { data: updatedConfig, error: updateError } = await supabase
      .from('admin_config')
      .update({
        zeryt_exchange_rate: Number(zeryt_exchange_rate),
        min_withdrawal_amount: Number(min_withdrawal_amount),
        updated_at: new Date().toISOString(),
      })
      .eq('id', configId)
      .select()

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      )
    }

    if (!updatedConfig || updatedConfig.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update config' },
        { status: 400 }
      )
    }

    const config = updatedConfig[0]
    return NextResponse.json({
      id: config.id,
      zeryt_exchange_rate: Number(config.zeryt_exchange_rate),
      min_withdrawal_amount: Number(config.min_withdrawal_amount),
    })
  } catch (error) {
    console.error('[v0] Update config error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
