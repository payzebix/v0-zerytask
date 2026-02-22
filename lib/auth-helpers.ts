import { createServerSupabaseClient } from './supabase-server'
import { NextResponse } from 'next/server'

export async function verifyAdmin() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      authorized: false,
      user: null,
      error: 'Unauthorized',
    }
  }

  // Check if user is admin from users table
  const { data: adminUser, error: adminError } = await supabase
    .from('users')
    .select('is_admin, id, email')
    .eq('id', user.id)
    .single()

  if (adminError || !adminUser?.is_admin) {
    return {
      authorized: false,
      user: null,
      error: 'Admin access required',
    }
  }

  return {
    authorized: true,
    user: adminUser,
    error: null,
  }
}

export async function verifyUser() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      authorized: false,
      user: null,
      error: 'Unauthorized',
    }
  }

  return {
    authorized: true,
    user,
    error: null,
  }
}

export function createErrorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}
