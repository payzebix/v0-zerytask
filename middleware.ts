import { type NextRequest, NextResponse } from 'next/server'

/**
 * BULLETPROOF MIDDLEWARE
 * 
 * This middleware never crashes and never blocks requests.
 * It gracefully handles missing environment variables and
 * silently continues on any error.
 */

export function middleware(request: NextRequest) {
  try {
    // Don't process requests that don't need session management
    const pathname = request.nextUrl.pathname
    if (isExcludedPath(pathname)) {
      return NextResponse.next({ request })
    }

    // Just pass through - no session refresh needed
    // Supabase auth is handled via browser cookies
    return NextResponse.next({ request })
  } catch (error) {
    console.debug('[v0] Middleware error (non-critical):', error)
    // Always return success - never block requests
    return NextResponse.next({ request })
  }
}

/**
 * Paths that should not go through session middleware
 */
function isExcludedPath(pathname: string): boolean {
  const excludedPaths = [
    // Static files and system routes
    '/_next',
    '/favicon.ico',
    // Auth setup routes
    '/setup',
    '/api/setup',
    // Health checks
    '/health',
    '/api/health',
  ]

  return excludedPaths.some((path) => pathname.startsWith(path))
}

export const config = {
  matcher: [
    /**
     * Match all paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - health checks
     * - setup routes
     * 
     * Everything else passes through without session management
     * since Supabase auth is cookie-based and handled by browser
     */
    '/((?!_next/static|_next/image|favicon\\.ico|health|setup).*)',
  ],
}
