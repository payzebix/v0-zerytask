import { createClient } from '@supabase/supabase-js'
import { isValidUUID } from '@/lib/uuid-validator'

let adminClient: ReturnType<typeof createClient> | null = null

/**
 * ============================================================================
 * SUPABASE ADMIN CLIENT (Service Role)
 * ============================================================================
 *
 * Use this client for server-side admin operations that need to bypass RLS.
 * 
 * CRITICAL SECURITY RULES:
 * ✅ ALLOWED: Server Actions, API Route Handlers, Server Components
 * ❌ FORBIDDEN: Client Components, Frontend code, exposed to browser
 *
 * The service_role key bypasses Row-Level Security (RLS).
 * Only use it when absolutely necessary for admin operations.
 *
 * Example:
 *   const admin = getAdminSupabaseClient()
 *   await admin.from('missions').update({ status: 'active' }).eq('id', missionId)
 */
export function getAdminSupabaseClient() {
  if (!adminClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl) {
      throw new Error(
        'Admin client: Missing NEXT_PUBLIC_SUPABASE_URL environment variable'
      )
    }

    if (!supabaseServiceKey) {
      throw new Error(
        'Admin client: Missing SUPABASE_SERVICE_ROLE_KEY environment variable. ' +
        'This is required for server-side admin operations. ' +
        'Check your Vercel environment variables.'
      )
    }

    adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  return adminClient
}

/**
 * Check admin access with full validation
 * Validates user UUID before making database queries
 */
export async function verifyAdminAccessWithValidation(userId: string) {
  // Validate user ID format
  if (!isValidUUID(userId)) {
    throw new Error('Invalid user ID format')
  }

  const admin = getAdminSupabaseClient()
  
  const { data, error } = await admin
    .from('users')
    .select('is_admin')
    .eq('id', userId)
    .single()

  if (error) {
    throw new Error(`Admin check failed: ${error.message}`)
  }

  if (!data?.is_admin) {
    throw new Error('User is not an admin')
  }

  return true
}
