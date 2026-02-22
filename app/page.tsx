'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Navigation } from '@/components/Navigation'
import { TrendingUp, ArrowRight, Sparkles } from 'lucide-react'
import useSWR from 'swr'

interface MissionProfile {
  id: string
  name: string
  description: string
  logo_url?: string
  icon_url?: string
  total_xp_reward: number
  total_zeryt_reward: number
  category_id: string
}

interface UserProfile {
  id: string
  username: string
  xp_balance: number
  zeryt_balance: number
  current_level: number
  avatar_url?: string
  is_admin: boolean
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return await res.json()
}

export default function HomePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [setupError, setSetupError] = useState<any>(null)

  console.log('[v0] HomePage loaded, user:', user?.id, 'authLoading:', authLoading)

  const { data: userProfile, error: profileError } = useSWR<UserProfile>(
    user && !authLoading ? '/api/users/me' : null,
    fetcher,
    { onError: (error) => console.error('[v0] Error fetching user profile:', error) }
  )

  const { data: profilesData, error: profilesError } = useSWR<MissionProfile[]>(
    user && !authLoading ? '/api/mission-profiles' : null,
    fetcher,
    { onError: (error) => console.error('[v0] Error fetching profiles:', error) }
  )

  console.log('[v0] HomePage - userProfile:', userProfile, 'profilesData:', profilesData?.length)

  // Handle setup errors
  useEffect(() => {
    if (profileError) {
      try {
        if (profileError.message?.includes('503') || profileError.message?.includes('404')) {
          setSetupError({
            title: 'Database Setup Required',
            message: 'The application database tables have not been created yet.',
            steps: [
              'Go to your Supabase project dashboard',
              'Navigate to SQL Editor',
              'Create a new query and paste the content from /scripts/00_create_all_tables.sql',
              'Execute the query to create all required tables'
            ]
          })
        }
      } catch (e) {
        // Silent catch
      }
    }
  }, [profileError])

  const profiles = Array.isArray(profilesData) ? profilesData : []

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    } else if (userProfile?.is_admin) {
      setIsAdmin(true)
      router.push('/admin')
    }
  }, [user, authLoading, userProfile, router])

  if (setupError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-card rounded-xl border border-destructive/50 p-8 text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">Database Setup Required</h1>
            <p className="text-muted-foreground mb-6">
              {setupError.message}
            </p>
            <div className="bg-muted rounded-lg p-4 text-left mb-6">
              <p className="text-sm font-semibold text-foreground mb-3">Setup Steps:</p>
              <ol className="space-y-2 text-sm text-muted-foreground">
                {setupError.steps.map((step: string, idx: number) => (
                  <li key={idx} className="flex gap-2">
                    <span className="text-primary font-semibold flex-shrink-0">{idx + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-colors w-full justify-center"
            >
              Open Supabase Dashboard →
            </a>
          </div>
        </div>
      </div>
    )
  }

  if (authLoading || !user || !userProfile) {
    return null
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navigation isAdmin={isAdmin} />

      {/* Hero Section */}
      <div className="relative overflow-hidden px-4 pt-8 pb-12">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative">
          {/* Welcome Section */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Welcome back
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                {userProfile.username}
              </h1>
            </div>
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
              {userProfile.avatar_url ? (
                <img
                  src={userProfile.avatar_url || "/placeholder.svg"}
                  alt={userProfile.username}
                  className="w-full h-full rounded-xl object-cover"
                />
              ) : (
                <span className="text-white font-bold text-xl">
                  {userProfile.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* ZeryT Card Only */}
          <div className="grid grid-cols-1 gap-3 mb-8">
            <div className="bg-card rounded-xl border border-border p-4 sm:p-6 hover:border-primary/50 transition-colors duration-200">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp size={18} className="text-primary" />
              </div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Available Balance</p>
              <p className="text-3xl sm:text-4xl font-bold text-foreground">
                {typeof userProfile?.zeryt_balance === 'number' 
                  ? userProfile.zeryt_balance.toFixed(2)
                  : '0.00'}
              </p>
              <p className="text-xs text-muted-foreground mt-2">ZeryT</p>
              <Link
                href="/exchange"
                className="text-sm text-primary hover:text-primary/80 mt-3 font-semibold inline-flex items-center gap-2"
              >
                Exchange Rewards <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Featured Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                <Sparkles size={20} className="text-accent" />
                Available Missions
              </h2>
              <Link
                href="/missions"
                className="text-sm text-primary hover:text-primary/80 font-semibold flex items-center gap-1"
              >
                View All <ArrowRight size={14} />
              </Link>
            </div>

            {profiles.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border border-dashed">
                <p className="text-muted-foreground">No missions available yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {profiles.slice(0, 6).map((profile) => (
                  <Link
                    key={profile.id}
                    href={`/missions/profile/${profile.id}`}
                    className="group bg-card rounded-xl border border-border p-4 hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
                  >
                    {/* Icon */}
                    <div className="flex items-start justify-between mb-3">
                      {profile.logo_url ? (
                        <img
                          src={profile.logo_url}
                          alt={profile.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                          <span className="text-white font-bold text-xs">
                            {profile.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>

                    {/* Content */}
                    <h3 className="font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {profile.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                      {profile.description || 'No description'}
                    </p>

                    {/* Rewards */}
                    <div className="flex gap-2 text-xs font-semibold">
                      <span className="text-accent">+{profile.total_xp_reward} XP</span>
                      <span className="text-primary">+{profile.total_zeryt_reward} ZeryT</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl border border-primary/30 p-6 text-center">
            <h3 className="text-lg font-bold text-foreground mb-2">Ready to earn more?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Complete missions, earn XP and ZeryT, and climb the leaderboards
            </p>
            <Link
              href="/missions"
              className="inline-flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-colors"
            >
              <Sparkles size={16} />
              Explore Missions
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
