/**
 * SENTRY REMOVED - Error tracking disabled
 * All Sentry functions are now no-ops for backwards compatibility
 */

export function initializeSentry() {
  // No-op: Sentry disabled
}

export function captureException(error: unknown, context?: Record<string, any>) {
  // No-op: Sentry disabled
}

export function captureMessage(message: string, level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info') {
  // No-op: Sentry disabled
}

export function setSentryUser(userId: string, email?: string, username?: string) {
  // No-op: Sentry disabled
}

export function clearSentryUser() {
  // No-op: Sentry disabled
}

export function addSentryBreadcrumb(message: string, category: string = 'info', level: 'info' | 'warning' | 'error' = 'info', data?: Record<string, any>) {
  // No-op: Sentry disabled
}
