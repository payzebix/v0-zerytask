import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { generateReferralCode } from '@/lib/code-generator'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log('[v0] Generating referral code for user:', user?.id)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user exists in our database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, referral_code')
      .eq('id', user.id)
      .single()

    if (userError) {
      console.error('[v0] Error fetching user:', userError)
      return NextResponse.json({ error: 'User lookup failed' }, { status: 500 })
    }

    if (!userData) {
      console.log('[v0] User not found in database:', user.id)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user already has a referral code
    if (userData.referral_code) {
      console.log('[v0] User already has referral code:', userData.referral_code)
      return NextResponse.json(
        { error: 'User already has a referral code. Only 1 code is allowed per user.' },
        { status: 400 }
      )
    }

    // Generate one referral code (8 alphanumeric characters)
    const referralCode = generateReferralCode()
    console.log('[v0] Generated new code:', referralCode)

    // Create entry in invitation_codes table
    // User-generated codes have a max_uses of 3 per week
    const { data: codeData, error: codeInsertError } = await supabase
      .from('invitation_codes')
      .insert({
        code: referralCode,
        created_by: user.id,
        code_type: 'user', // Mark as user-generated
        status: 'active',
        max_uses: 3, // User codes can only invite 3 people
        current_uses: 0,
        is_used: false,
        week_reset_date: new Date().toISOString(), // Track week for resets
      })
      .select()

    if (codeInsertError) {
      console.error('[v0] Error inserting invitation code:', codeInsertError)
      throw codeInsertError
    }

    console.log('[v0] Invitation code created:', codeData)

    // Update user's referral_code in database
    const { error: updateError } = await supabase
      .from('users')
      .update({ referral_code: referralCode })
      .eq('id', user.id)

    if (updateError) {
      console.error('[v0] Error updating user referral code:', updateError)
      throw updateError
    }

    console.log('[v0] User referral code updated successfully')

    return NextResponse.json(
      {
        message: 'Referral code generated successfully',
        referral_code: referralCode,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[v0] Error generating referral code:', error)
    return NextResponse.json({ error: 'Failed to generate referral code', details: String(error) }, { status: 500 })
  }
}
