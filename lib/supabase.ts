import { createBrowserClient } from '@supabase/ssr'

let clientInstance: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  // Return cached instance if already created
  if (clientInstance) {
    return clientInstance
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error('[v0] Critical: Missing Supabase environment variables in browser client', {
      hasUrl: !!url,
      hasKey: !!key,
    })
    throw new Error(
      'Supabase environment variables are not configured. ' +
      'Please verify NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
    )
  }

  clientInstance = createBrowserClient(url, key)
  return clientInstance
}
