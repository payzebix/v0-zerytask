import { createClient } from '@supabase/supabase-js'

/**
 * Create a Supabase client with service role key (bypasses RLS)
 * Use only for admin operations that require database writes
 */
export function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase service role configuration')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Verify admin access before operations
 * This checks if the current user is an admin
 */
export async function verifyAdminAccessAndGetClient() {
  // First check with server client (has auth context)
  const { createServerSupabaseClient } = await import('@/lib/supabase-server')
  const supabase = await createServerSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  // Check if user is admin
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (userError || !userData?.is_admin) {
    throw new Error('Not an admin')
  }

  // Return service role client for admin operations
  return {
    client: createServiceRoleClient(),
    userId: user.id,
  }
}
