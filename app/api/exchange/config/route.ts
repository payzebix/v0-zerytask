import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('admin_config')
      .select('*')
      .limit(1)

    if (error || !data || data.length === 0) {
      // Return defaults if not set
      return NextResponse.json({
        zeryt_exchange_rate: 0.05,
        min_withdrawal_amount: 500,
      })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error('[v0] Get config error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
