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

    const { zeryt_amount, wallet_address } = await request.json()

    if (!zeryt_amount || !wallet_address) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get config for minimum amount
    const { data: config } = await supabase
      .from('admin_config')
      .select('min_withdrawal_amount, zeryt_exchange_rate')
      .single()

    const minAmount = config?.min_withdrawal_amount || 500
    const rate = config?.zeryt_exchange_rate || 0.05

    if (zeryt_amount < minAmount) {
      return NextResponse.json(
        {
          error: `Minimum exchange amount is ${minAmount} ZeryT`,
        },
        { status: 400 }
      )
    }

    // Check for existing pending request with same amount and wallet
    const { data: existingRequest } = await supabase
      .from('exchange_requests')
      .select('id')
      .eq('user_id', user.id)
      .eq('zeryt_amount', zeryt_amount)
      .eq('wallet_address', wallet_address)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingRequest) {
      return NextResponse.json(
        {
          error: 'You already have a pending request for this amount to this wallet. Please wait or cancel it first.',
        },
        { status: 400 }
      )
    }

    // Check user balance
    const { data: userProfile } = await supabase
      .from('users')
      .select('zeryt_balance')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.zeryt_balance < zeryt_amount) {
      return NextResponse.json(
        { error: 'Insufficient ZeryT balance' },
        { status: 400 }
      )
    }

    // Create exchange request
    const usdc_amount = zeryt_amount * rate
    const payment_deadline = new Date()
    payment_deadline.setDate(payment_deadline.getDate() + 3)

    const { data: exchangeRequest, error: createError } = await supabase
      .from('exchange_requests')
      .insert({
        user_id: user.id,
        zeryt_amount,
        usdc_amount,
        wallet_address,
        status: 'pending',
        exchange_rate: rate,
        payment_deadline: payment_deadline.toISOString(),
      })
      .select()
      .single()

    if (createError) {
      return NextResponse.json(
        { error: createError.message },
        { status: 400 }
      )
    }

    return NextResponse.json(exchangeRequest, { status: 201 })
  } catch (error) {
    console.error('[v0] Exchange request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
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

    const { data: requests, error } = await supabase
      .from('exchange_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(requests)
  } catch (error) {
    console.error('[v0] Get exchanges error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
