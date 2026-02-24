import { createClient } from '@supabase/supabase-js'

/**
 * ============================================================================
 * SETUP SUPABASE CLIENT - For initialization only
 * ============================================================================
 *
 * This client is used ONLY during the setup process.
 * It uses the service_role key to initialize the database.
 * It does NOT require user authentication.
 *
 * CRITICAL: This client should ONLY be used in:
 * - /api/setup/* endpoints
 * - /setup page initialization
 *
 * It bypasses all RLS policies because it uses service_role.
 */

let setupClient: ReturnType<typeof createClient> | null = null

export function getSetupSupabaseClient() {
  if (!setupClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl) {
      throw new Error(
        'Setup client: Missing NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
        'Ensure your Supabase project URL is configured in environment variables.'
      )
    }

    if (!supabaseServiceKey) {
      throw new Error(
        'Setup client: Missing SUPABASE_SERVICE_ROLE_KEY environment variable. ' +
        'This is required for setup operations. ' +
        'Add it to your environment variables in Vercel.'
      )
    }

    setupClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  return setupClient
}
