'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Navigation } from '@/components/Navigation'
import { ArrowLeft, ChevronRight, Check, Clock } from 'lucide-react'
import useSWR from 'swr'

interface MissionProfile {
  id: string
  name: string
  description: string
  logo_url?: string
  category_id: string
  total_xp_reward: number
  total_zeryt_reward: number
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function MissionsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
    if (user?.email === 'remgoficial@gmail.com') {
      setIsAdmin(true)
    }
  }, [user, authLoading, router])

  const { data: profilesData, error: profilesError } = useSWR<MissionProfile[]>(
    user ? '/api/mission-profiles' : null,
    fetcher
  )

  const profiles = Array.isArray(profilesData) ? profilesData : []

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background pb-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading missions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navigation isAdmin={isAdmin} />

      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-sm border-b border-border px-4 py-4 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-muted rounded-lg transition"
        >
          <ArrowLeft size={20} className="text-muted-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground flex-1 text-center">
          Missions
        </h1>
        <div className="w-8"></div>
      </div>

      {/* Profiles List */}
      <div className="px-4 py-4">
        {profiles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No mission profiles available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                onClick={() => router.push(`/${encodeURIComponent(profile.name)}`)}
                className="block bg-card border border-border hover:border-primary/50 rounded-xl p-4 transition group cursor-pointer hover:bg-card/80"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Profile Icon/Logo */}
                    {profile.logo_url ? (
                      <img
                        src={profile.logo_url || "/placeholder.svg"}
                        alt={profile.name}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-foreground font-bold text-sm">
                          {profile.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground group-hover:text-primary transition truncate">
                        {profile.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {profile.description || 'No description available'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-muted-foreground group-hover:text-primary mt-1 flex-shrink-0 transition" />
                </div>

                {/* Rewards Preview */}
                <div className="flex gap-3 mt-3 pt-3 border-t border-border">
                  <span className="text-xs font-semibold text-primary">
                    ⚡ +{profile.total_xp_reward} XP
                  </span>
                  <span className="text-xs font-semibold text-accent">
                    💎 +{profile.total_zeryt_reward} ZeryT
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
