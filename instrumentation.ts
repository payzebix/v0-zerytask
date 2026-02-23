import { initializeSentry } from '@/lib/sentry'

// Initialize Sentry for error tracking
initializeSentry()

export async function register() {
  // Any additional initialization can be done here
  console.log('[v0] Instrumentation initialized')
}
