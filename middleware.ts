import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export function middleware(request: NextRequest) {
  try {
    // Validate environment variables exist
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[v0] Middleware: Missing Supabase environment variables', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey,
      })
      // For missing env vars, just pass through - don't crash
      return NextResponse.next({ request })
    }

    let supabaseResponse = NextResponse.next({
      request,
    })

    // Create Supabase client with error handling
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              supabaseResponse.cookies.set(name, value, options)
            })
          } catch (error) {
            console.debug('[v0] Middleware: Cookie set error (non-critical):', error)
          }
        },
      },
    })

    // Refresh session if it exists - non-blocking
    supabase.auth.getUser().catch((error) => {
      console.debug('[v0] Middleware: Session refresh failed (non-critical):', error)
    })

    return supabaseResponse
  } catch (error) {
    console.error('[v0] Middleware: Unexpected error', error)
    // Always return something - never crash the middleware
    return NextResponse.next({ request })
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - /api/setup (setup API routes, these handle env validation themselves)
     * - /setup (setup page, doesn't need session)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|api/setup|setup).*)',
  ],
}
