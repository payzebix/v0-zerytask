import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { code } = await request.json()

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Invalid code format' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    // Find the code
    const { data: codeData, error: findError } = await supabase
      .from('invitation_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .maybeSingle()

    if (findError) {
      console.error('[v0] Error finding invitation code:', findError)
      // Check if table doesn't exist (PGRST205 error)
      if (findError.message?.includes('Could not find the table') || findError.code === 'PGRST205') {
        return NextResponse.json({ 
          error: 'Invitation system not set up. Please contact administrator.' 
        }, { status: 503 })
      }
      return NextResponse.json({ error: 'Invalid invitation code' }, { status: 404 })
    }

    if (!codeData) {
      return NextResponse.json({ error: 'Invalid invitation code' }, { status: 404 })
    }

    // Check if code has reached max uses
    if (codeData.max_uses && (codeData.current_uses || 0) >= codeData.max_uses) {
      return NextResponse.json({ error: 'This code has reached its usage limit' }, { status: 400 })
    }

    // Check if code is expired
    if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This code has expired' }, { status: 400 })
    }

    // Check if code is revoked
    if (codeData.status === 'revoked' || codeData.status === 'expired') {
      return NextResponse.json({ error: 'This code is no longer valid' }, { status: 400 })
    }

    // Calculate remaining uses for the code
    const remainingUses = codeData.max_uses ? codeData.max_uses - (codeData.current_uses || 0) : null

    return NextResponse.json({
      valid: true,
      code: codeData,
      remainingUses,
      codeType: codeData.code_type || 'admin',
    }, { status: 200 })
  } catch (error) {
    console.error('[v0] Error validating invitation code:', error)
    return NextResponse.json({ error: 'Failed to validate code' }, { status: 500 })
  }
}
