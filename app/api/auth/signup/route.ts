import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { isAdminSetupCode } from '@/lib/code-generator'

export async function POST(request: Request) {
  try {
    const { email, password, username, invitation_code, referral_code } = await request.json()

    if (!email || !password || !invitation_code) {
      return NextResponse.json(
        { error: 'Email, password, and invitation code are required' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    let codeData = null
    const isAdminCode = isAdminSetupCode(invitation_code)

    // Check if PAY1810 has been used
    let pay1810Used = false
    if (!isAdminCode) {
      const { data: pay1810Data } = await supabase
        .from('invitation_codes')
        .select('*')
        .eq('code', 'PAY1810')
        .maybeSingle()

      if (pay1810Data?.is_used || pay1810Data?.status === 'used') {
        pay1810Used = true
      }
    }

    // After PAY1810 is used, invitation code is mandatory
    if (!isAdminCode && pay1810Used && !invitation_code?.trim()) {
      return NextResponse.json(
        { error: 'Invitation code is required to register' },
        { status: 400 }
      )
    }

    // Validate invitation code
    if (invitation_code?.trim()) {
      const { data: foundCode, error: codeError } = await supabase
        .from('invitation_codes')
        .select('*')
        .eq('code', invitation_code.toUpperCase())
        .maybeSingle()

      // If table doesn't exist, skip code validation
      if (codeError?.message?.includes('Could not find the table')) {
        console.log('[v0] Invitation codes table not found, skipping validation')
      } else if (codeError || !foundCode) {
        return NextResponse.json(
          { error: 'Invalid invitation code' },
          { status: 400 }
        )
      } else {
        codeData = foundCode

        if (codeData.is_used || codeData.status === 'used') {
          return NextResponse.json(
            { error: 'This invitation code has already been used' },
            { status: 400 }
          )
        }

        if (codeData.status === 'revoked' || codeData.status === 'expired') {
          return NextResponse.json(
            { error: 'This invitation code is no longer valid' },
            { status: 400 }
          )
        }

        if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
          return NextResponse.json(
            { error: 'This invitation code has expired' },
            { status: 400 }
          )
        }

        // Check max uses
        if (codeData.max_uses && (codeData.current_uses || 0) >= codeData.max_uses) {
          return NextResponse.json(
            { error: 'This invitation code has reached its usage limit' },
            { status: 400 }
          )
        }
      }
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Check if username already exists
    const finalUsername = username || email.split('@')[0]
    const { data: existingUsername } = await supabase
      .from('users')
      .select('id')
      .eq('username', finalUsername)
      .maybeSingle()

    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username already taken. Please choose a different username.' },
        { status: 400 }
      )
    }

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback`,
        data: {
          username: username || email.split('@')[0],
        },
      },
    })

    if (authError) {
      // Handle specific error cases
      if (authError.message?.includes('email rate limit')) {
        return NextResponse.json(
          {
            error: 'Too many signup attempts with this email. Please try again later or use a different email address.',
            code: 'email_rate_limit',
          },
          { status: 429 }
        )
      }

      if (authError.message?.includes('already registered')) {
        return NextResponse.json(
          {
            error: 'This email is already registered. Please log in instead.',
            code: 'user_exists',
          },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: authError.message || 'Signup failed', code: 'auth_error' },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 400 }
      )
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10)

    // Find referrer from invitation code's created_by
    let referrerId = null
    if (codeData && codeData.created_by) {
      referrerId = codeData.created_by
    }

    // Create user record with admin status if it's the admin email
    // NOTE: A trigger on auth.users should automatically create this record
    // But we also attempt it here for redundancy
    const isAdmin = email === 'remgoficial@gmail.com'
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        password_hash: passwordHash,
        username: username || email.split('@')[0],
        is_admin: isAdmin,
        xp_balance: 0,
        zeryt_balance: 0,
        current_level: 1,
        referral_code: null,
        referred_by: referrerId,
      })

    if (userError) {
      console.error('[v0] User creation error:', {
        code: userError.code,
        message: userError.message,
        details: userError.details,
        hint: userError.hint,
      })
      
      // If it's a duplicate key error, the trigger likely already created the record
      // This is expected and not an error
      if (userError.code === '23505') {
        console.log('[v0] User record already exists (created by trigger)')
        // Try to update with additional data if needed
        const { error: updateError } = await supabase
          .from('users')
          .update({
            referred_by: referrerId,
            password_hash: passwordHash,
          })
          .eq('id', authData.user.id)
        
        if (updateError) {
          console.warn('[v0] Could not update user record:', updateError.message)
        }
      } else {
        // For other errors, log but don't fail signup
        // User was created in auth, so they can still log in
        console.warn('[v0] User database record could not be fully created, but auth user was created')
      }
    } else {
      // User record created successfully via API
      console.log('[v0] User record created successfully via signup API')
    }

    // Create referral record if user was referred
    if (referrerId) {
      const { error: referralError } = await supabase
        .from('referrals')
        .insert({
          referrer_id: referrerId,
          referral_user_id: authData.user.id,
          status: 'pending',
        })

      if (referralError) {
        console.error('[v0] Error creating referral record:', referralError)
      }
    }

    // Update usage count for the invitation code
    if (codeData) {
      const newUseCount = (codeData.current_uses || 0) + 1
      const codeIsFullyUsed = codeData.max_uses && newUseCount >= codeData.max_uses

      const { error: updateCodeError } = await supabase
        .from('invitation_codes')
        .update({
          current_uses: newUseCount,
          used_by: authData.user.id,
          is_used: codeIsFullyUsed,
          status: codeIsFullyUsed ? 'used' : 'active',
          used_at: codeIsFullyUsed ? new Date().toISOString() : codeData.used_at,
          updated_at: new Date().toISOString(),
        })
        .eq('id', codeData.id)

      if (updateCodeError) {
        console.error('[v0] Error updating invitation code usage:', updateCodeError)
      }
    }

    return NextResponse.json(
      {
        message: 'Signup successful. Please check your email to confirm.',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          is_admin: isAdmin,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[v0] Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
