'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Navigation } from '@/components/Navigation'
import { ArrowLeft, Copy, Check, Clock, Users, TrendingUp, Gift } from 'lucide-react'
import useSWR from 'swr'
import { ReferralConfig } from '@/types/ReferralConfig' // Declare ReferralConfig

interface UserProfile {
  id: string
  username: string
  xp_balance: number
  zeryt_balance: number
  current_level: number
  referral_code: string
}

interface ReferralUser {
  id: string
  referrer_id: string
  referred_user_id: string
  status: 'pending' | 'valid' | 'invalid'
  created_at: string
  username: string | null
  email: string | null
  current_level: number
  missions_completed: number
  referral_earnings_zeryt: number
  code_used: string | null
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function ReferralsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [copied, setCopied] = useState(false)
  const [totalValueEarned, setTotalValueEarned] = useState(0)
  const [referralConfig, setReferralConfig] = useState({ xp_reward: 0, zeryt_reward: 0, usdc_reward: 0, min_level_requirement: 0, min_missions_requirement: 0 })
  const [activeReferrals, setActiveReferrals] = useState(0)
  const [isGeneratingCode, setIsGeneratingCode] = useState(false)
  const [codeError, setCodeError] = useState<string | null>(null)

  const { data: userProfile } = useSWR<UserProfile>(
    user ? '/api/users/me' : null,
    fetcher
  )

  const { data: referralUsers } = useSWR<ReferralUser[]>(
    user ? '/api/referrals/my-referrals' : null,
    fetcher
  )

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
    if (user?.email === 'remgoficial@gmail.com') {
      setIsAdmin(true)
    }
    if (Array.isArray(referralUsers)) {
      setTotalValueEarned(referralUsers.reduce((sum, r) => sum + (r.referral_earnings_zeryt || 0), 0))
      setActiveReferrals(referralUsers.filter(r => r.status === 'valid').length)
    }
  }, [user, authLoading, router, referralUsers])

  const handleGenerateCode = async () => {
    try {
      setIsGeneratingCode(true)
      setCodeError(null)
      
      const response = await fetch('/api/users/generate-referral-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (!response.ok) {
        setCodeError(data.error || 'Failed to generate referral code')
        return
      }

      // Refetch user profile to update the referral code
      const userResponse = await fetch('/api/users/me')
      if (userResponse.ok) {
        // Trigger SWR revalidation by mutating the cache
        window.location.reload()
      }
    } catch (error) {
      console.error('[v0] Error generating code:', error)
      setCodeError('An error occurred while generating the code')
    } finally {
      setIsGeneratingCode(false)
    }
  }

  const handleCopyLink = () => {
    if (userProfile?.referral_code) {
      const referralLink = `${window.location.origin}?ref=${userProfile.referral_code}`
      navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Stats calculation
  const totalReferrals = Array.isArray(referralUsers) ? referralUsers.length : 0
  const validReferrals = Array.isArray(referralUsers) ? referralUsers.filter(r => r.status === 'valid').length : 0
  const remainingSlots = Math.max(0, 3 - totalReferrals)
  const totalEarnings = Array.isArray(referralUsers) ? referralUsers.reduce((sum, r) => sum + (r.referral_earnings_zeryt || 0), 0) : 0

  if (authLoading || !user || !userProfile) {
    return null
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navigation isAdmin={isAdmin} />

      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-sm border-b border-border px-4 py-4 flex items-center justify-between">
        <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-lg transition">
          <ArrowLeft size={20} className="text-muted-foreground" />
        </button>
        <div className="text-center flex-1">
          <h1 className="text-lg font-bold text-foreground">Referral Hub</h1>
          <p className="text-xs text-primary">INVITE & EARN</p>
        </div>
        <div className="w-8"></div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Error Message */}
        {codeError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-sm text-red-600 dark:text-red-400">{codeError}</p>
          </div>
        )}

        {/* Hero Card - Referral Code */}
        <div className="bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/30 rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Your Referral Code</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground font-mono">
                {userProfile?.referral_code ? userProfile.referral_code : 'No code yet'}
              </h2>
            </div>
            <Gift size={24} className="text-primary flex-shrink-0" />
          </div>
          {userProfile?.referral_code ? (
            <button
              onClick={handleCopyLink}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
                copied
                  ? 'bg-accent/20 text-accent'
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground'
              }`}
            >
              {copied ? (
                <>
                  <Check size={18} />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={18} />
                  Copy Code
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleGenerateCode}
              disabled={isGeneratingCode}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all duration-200 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingCode ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Generating...
                </>
              ) : (
                <>
                  <Gift size={18} />
                  Generate Code
                </>
              )}
            </button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-card rounded-xl border border-border p-4 hover:border-primary/50 transition-colors">
            <p className="text-xs font-medium text-muted-foreground mb-2">Total Invited</p>
            <p className="text-2xl sm:text-3xl font-bold text-foreground">{totalReferrals}</p>
            <p className="text-xs text-muted-foreground mt-1">/ 3 slots</p>
          </div>

          <div className="bg-card rounded-xl border border-border p-4 hover:border-primary/50 transition-colors">
            <p className="text-xs font-medium text-muted-foreground mb-2">Valid Referrals</p>
            <p className="text-2xl sm:text-3xl font-bold text-accent">{validReferrals}</p>
            <p className="text-xs text-muted-foreground mt-1">Completed criteria</p>
          </div>

          <div className="bg-card rounded-xl border border-border p-4 hover:border-primary/50 transition-colors col-span-2 sm:col-span-1">
            <p className="text-xs font-medium text-muted-foreground mb-2">Earnings</p>
            <p className="text-2xl sm:text-3xl font-bold text-primary">{totalEarnings.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground mt-1">ZeryT earned</p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Users size={20} className="text-primary" />
            How It Works
          </h3>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/20 text-primary font-bold text-sm">1</div>
              </div>
              <div>
                <p className="font-semibold text-foreground">Share Your Code</p>
                <p className="text-sm text-muted-foreground">Share code <span className="font-mono text-primary">{userProfile?.referral_code || 'Loading...'}</span> with friends</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/20 text-primary font-bold text-sm">2</div>
              </div>
              <div>
                <p className="font-semibold text-foreground">Friend Uses Your Code</p>
                <p className="text-sm text-muted-foreground">They sign up with your code to register in the system</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/20 text-primary font-bold text-sm">3</div>
              </div>
              <div>
                <p className="font-semibold text-foreground">Friend Completes Criteria</p>
                <p className="text-sm text-muted-foreground">They need ONE of: 30 missions, Level 5, or 1 valid referral</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/20 text-primary font-bold text-sm">4</div>
              </div>
              <div>
                <p className="font-semibold text-foreground">Earn Rewards</p>
                <p className="text-sm text-muted-foreground">Get 10 XP + 100 ZeryT instantly. Then earn 15% of their ZeryT forever</p>
              </div>
            </div>
          </div>
        </div>

        {/* Code Limit Info */}
        <div className="bg-accent/10 border border-accent/30 rounded-xl p-4">
          <p className="text-sm text-foreground font-semibold mb-2">Weekly Limit</p>
          <p className="text-xs text-muted-foreground">You can invite up to 3 people per week. Your weekly count resets every 7 days.</p>
        </div>

        {/* Referral Slots */}
        {remainingSlots > 0 && (
          <div className="bg-accent/10 border border-accent/30 rounded-xl p-4">
            <p className="text-sm text-foreground font-semibold">
              {remainingSlots} referral slot{remainingSlots !== 1 ? 's' : ''} remaining
            </p>
            <div className="flex gap-2 mt-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-full ${
                    i < totalReferrals ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Referral List */}
        {referralUsers && referralUsers.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-primary" />
              Your Referrals
            </h3>

            <div className="space-y-3">
              {referralUsers.map((referral) => {
                const isValid = referral.status === 'valid'
                const daysAgo = Math.floor(
                  (Date.now() - new Date(referral.created_at).getTime()) /
                    (1000 * 60 * 60 * 24)
                )
                const username = referral.username || referral.email?.split('@')[0] || 'User'

                return (
                  <div
                    key={referral.id}
                    className={`bg-card rounded-lg border p-4 flex items-center justify-between transition-all ${
                      isValid ? 'border-primary/50 bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">
                          {username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{username}</p>
                        <p className="text-xs text-muted-foreground">
                          {daysAgo} day{daysAgo !== 1 ? 's' : ''} ago • Lvl {referral.current_level}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      {isValid ? (
                        <div className="flex flex-col items-end gap-1">
                          <div className="inline-flex items-center gap-1 px-2 py-1 bg-accent/20 rounded">
                            <Check size={14} className="text-accent" />
                            <span className="text-xs font-bold text-accent">Valid</span>
                          </div>
                          {referral.code_used && (
                            <p className="text-xs text-muted-foreground font-mono mt-1">
                              Code: {referral.code_used}
                            </p>
                          )}
                          <p className="text-xs text-primary font-semibold">
                            +{referral.referral_earnings_zeryt?.toFixed(1) || '0'} ZeryT
                          </p>
                        </div>
                      ) : (
                        <div className="text-right">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Progress</p>
                          <p className="text-xs text-foreground font-semibold">
                            {referral.missions_completed}/30 missions
                          </p>
                          {referral.code_used && (
                            <p className="text-xs text-muted-foreground font-mono mt-1">
                              Code: {referral.code_used}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!referralUsers || referralUsers.length === 0) && (
          <div className="text-center py-12 bg-card rounded-xl border border-dashed border-border">
            <Users size={32} className="text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-foreground font-semibold mb-1">No referrals yet</p>
            <p className="text-sm text-muted-foreground">Share your code to start earning</p>
          </div>
        )}
      </div>
    </div>
  )
}
