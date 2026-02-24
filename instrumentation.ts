import { initializeSentry } from '@/lib/sentry'

// Initialize Sentry for error tracking (only called once)
initializeSentry()

export async function register() {
  // Any additional initialization can be done here
  // Note: Sentry is already initialized above, no need to log again
}
