import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('[v0] Auth error:', userError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[v0] Getting profile for user:', user.id)

    // Try to fetch user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    // Handle table not found error (PGRST205)
    if (profileError?.code === 'PGRST205') {
      console.error('[v0] Users table not found. Database setup required.')
      return NextResponse.json(
        { 
          error: 'Database setup required',
          message: 'Please run the database setup script in Supabase SQL Editor',
          setupInstructions: {
            step1: 'Go to your Supabase project > SQL Editor',
            step2: 'Create a new query and paste the content from /scripts/00_create_all_tables.sql',
            step3: 'Execute the query to create all tables'
          }
        },
        { status: 503 }
      )
    }

    // If user profile doesn't exist, create it
    if (profileError?.code === 'PGRST116') {
      console.log('[v0] User profile not found, creating new one')
      
      const newProfile = {
        id: user.id,
        email: user.email || '',
        password_hash: '', // Empty hash for Supabase auth users
        username: (user.email || '').split('@')[0],
        xp_balance: 0,
        zeryt_balance: 0.0,
        current_level: 1,
        wallet_address: null,
        twitter_handle: null,
        avatar_url: null,
        referral_code: Math.random().toString(36).substring(2, 11),
        referred_by: null,
        is_admin: user.email === 'remgoficial@gmail.com',
        status: 'active',
      }

      const { data: created, error: createError } = await supabase
        .from('users')
        .insert(newProfile)
        .select()
        .single()

      if (createError) {
        console.error('[v0] Failed to create profile:', createError)
        
        // If duplicate key error, try fetching again (race condition)
        if (createError.code === '23505') {
          console.log('[v0] Duplicate key, retrying fetch')
          const { data: retryProfile, error: retryError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single()
          
          if (!retryError && retryProfile) {
            return NextResponse.json(retryProfile)
          }
        }
        
        return NextResponse.json(
          { error: 'Failed to create user profile' },
          { status: 500 }
        )
      }

      console.log('[v0] Profile created successfully')
      return NextResponse.json(created)
    }

    if (profileError) {
      console.error('[v0] Profile fetch error:', profileError.message, 'code:', profileError.code)
      
      // Handle RLS infinite recursion error
      if (profileError.message?.includes('infinite recursion')) {
        console.error('[v0] RLS infinite recursion detected - policies need to be fixed')
        return NextResponse.json(
          { error: 'Database configuration error - please contact admin' },
          { status: 503 }
        )
      }
      
      if (profileError.message?.includes('rate')) {
        return NextResponse.json(
          { error: 'Too many requests' },
          { status: 429 }
        )
      }
      
      return NextResponse.json({ error: 'Failed to fetch profile', details: profileError.message }, { status: 500 })
    }

    return NextResponse.json(userProfile)
  } catch (error) {
    console.error('[v0] Unexpected error in /api/users/me:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
