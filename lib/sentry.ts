import * as Sentry from '@sentry/nextjs'

/**
 * Initialize Sentry for error tracking and performance monitoring
 * This function should be called in instrumentation.ts or the root layout
 */
export function initializeSentry() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

  if (!dsn) {
    console.warn('[v0] Sentry DSN not configured. Error tracking is disabled.')
    return
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    debug: process.env.NODE_ENV === 'development',
    integrations: [
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Capture Replay for 10% of all sessions,
    // plus 100% of sessions with an error
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  })
}

/**
 * Capture an exception to Sentry
 */
export function captureException(error: unknown, context?: Record<string, any>) {
  console.error('[v0] Sentry exception captured:', error, context)
  
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value)
      })
    }
    
    Sentry.captureException(error)
  })
}

/**
 * Capture a message to Sentry
 */
export function captureMessage(message: string, level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info') {
  console.log('[v0] Sentry message captured:', message, 'level:', level)
  Sentry.captureMessage(message, level)
}

/**
 * Set user context for Sentry
 */
export function setSentryUser(userId: string, email?: string, username?: string) {
  Sentry.setUser({
    id: userId,
    email,
    username,
  })
}

/**
 * Clear user context
 */
export function clearSentryUser() {
  Sentry.setUser(null)
}

/**
 * Add breadcrumb for debugging
 */
export function addSentryBreadcrumb(message: string, category: string = 'info', level: 'info' | 'warning' | 'error' = 'info', data?: Record<string, any>) {
  Sentry.captureMessage(message, level)
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
  })
}
