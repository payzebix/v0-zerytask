import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[v0] Critical: Missing Supabase environment variables in middleware', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
    })
    // Return error response instead of throwing
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    )
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options)
        })
      },
    },
  })

  // Refresh session if it exists
  try {
    await supabase.auth.getUser()
  } catch (error) {
    console.error('[v0] Error refreshing user session in middleware:', error)
    // Continue anyway - session refresh failure shouldn't block the request
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)',
  ],
}
