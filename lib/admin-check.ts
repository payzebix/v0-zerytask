import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function checkAdminAccess() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('[v0] Auth error in admin check:', error.message)
      return false
    }

    if (!user) {
      console.log('[v0] No authenticated user for admin check')
      return false
    }

    const { data, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    
    if (userError) {
      console.error('[v0] Error fetching user admin status:', userError.message)
      return false
    }

    const isAdmin = data?.is_admin === true
    console.log('[v0] Admin check for user', user.id, ':', isAdmin)
    return isAdmin
  } catch (error) {
    console.error('[v0] Unexpected error in admin check:', error)
    return false
  }
}
