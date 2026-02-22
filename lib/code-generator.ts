/**
 * Generates random alphanumeric codes for invitations and referrals
 */

const ALPHANUMERIC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

/**
 * Generate a random 8-character alphanumeric code
 * Used for both invitation codes and referral codes
 */
export function generateRandomCode(length: number = 8): string {
  let code = ''
  for (let i = 0; i < length; i++) {
    code += ALPHANUMERIC.charAt(Math.floor(Math.random() * ALPHANUMERIC.length))
  }
  return code
}

/**
 * Generate a single invitation code (8 characters, alphanumeric)
 * Used by admin to create invitation codes for users
 */
export function generateInvitationCode(): string {
  return generateRandomCode(8)
}

/**
 * Generate a referral code (8 characters, alphanumeric)
 * Generated for each user on signup
 */
export function generateReferralCode(): string {
  return generateRandomCode(8)
}

/**
 * Check if a code is the special admin setup code
 */
export function isAdminSetupCode(code: string): boolean {
  return code.toUpperCase() === 'PAY1810'
}
