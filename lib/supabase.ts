import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error('[v0] Missing Supabase environment variables:', {
      url: !!url,
      key: !!key,
    })
    throw new Error('Supabase environment variables are not configured')
  }

  return createBrowserClient(url, key)
}
