export interface ReferralConfig {
  xp_reward: number
  zeryt_reward: number
  usdc_reward?: number
  min_level_requirement: number
  min_missions_requirement: number
  multiplier?: number
}

export interface ReferralUser {
  id: string
  username: string
  email: string
  current_level: number
  status: 'pending' | 'valid' | 'invalid'
  joined_at: string
  missions_completed: number
  referral_earnings_zeryt: number
}

export interface UserProfile {
  id: string
  username: string
  xp_balance: number
  zeryt_balance: number
  current_level: number
  referral_code: string
}
