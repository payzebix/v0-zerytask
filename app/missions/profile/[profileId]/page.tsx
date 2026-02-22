'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Navigation } from '@/components/Navigation'
import { ArrowLeft, ChevronRight, Filter, Check, Clock, Lock } from 'lucide-react'
import useSWR from 'swr'
import { getMissionStatus, formatTimeRemaining } from '@/lib/mission-status'

interface Mission {
  id: string
  title: string
  description: string
  category: string
  xp_reward: number
  zeryt_reward: number
  image_url?: string
  verification_type?: string
  status?: string
  completion_status?: 'completed' | 'pending_review' | 'not_started'
  logo_url?: string
  social_network_id?: string | number
  start_date?: string
  start_time?: string
  end_date?: string
  end_time?: string
}

interface MissionProfile {
  id: string
  name: string
  description: string
  logo_url?: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function ProfileMissionsPage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'manual' | 'automatic'>('all')
  const [profileId, setProfileId] = useState<string | null>(null)

  // Safely extract and validate profileId
  useEffect(() => {
    if (params && params.profileId) {
      const id = params.profileId as string
      setProfileId(id)
    }
  }, [params])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
    if (user?.email === 'remgoficial@gmail.com') {
      setIsAdmin(true)
    }
  }, [user, authLoading, router])

  // Fetch profile details - only if profileId is valid
  const { data: profileData, error: profileError } = useSWR<MissionProfile>(
    user && profileId && typeof profileId === 'string' && profileId !== 'undefined' ? `/api/mission-profiles/${profileId}/get` : null,
    fetcher
  )

  // Fetch missions for this profile - only if profileId is valid
  const { data: missionsData, error: missionsError } = useSWR<Mission[]>(
    user && profileId && typeof profileId === 'string' && profileId !== 'undefined' ? `/api/missions/by-profile/${profileId}` : null,
    fetcher
  )

  const allMissions = Array.isArray(missionsData) ? missionsData : []
  const profile = profileData as MissionProfile | undefined

  // Filter missions by type
  const filteredMissions = allMissions.filter(m => {
    if (filterType === 'all') return true
    const isManual = m.verification_type?.toLowerCase() === 'manual'
    return filterType === 'manual' ? isManual : !isManual
  })

  const manualCount = allMissions.filter(m => m.verification_type?.toLowerCase() === 'manual').length
  const automaticCount = allMissions.length - manualCount

  // Add countdown timer state
  const [countdown, setCountdown] = useState<Record<string, string>>({})

  // Update countdown timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      const newCountdown: Record<string, string> = {}
      filteredMissions.forEach(mission => {
        const status = getMissionStatus(
          mission.start_date,
          mission.start_time,
          mission.end_date,
          mission.end_time,
          mission.completion_status
        )
        if (status.timeUntilAvailable) {
          newCountdown[mission.id] = formatTimeRemaining(status.timeUntilAvailable)
        }
      })
      setCountdown(newCountdown)
    }, 1000)

    return () => clearInterval(interval)
  }, [filteredMissions])

  if (authLoading || !user || !profileId) {
    return (
      <div className="min-h-screen bg-background pb-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (profileError) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <Navigation isAdmin={isAdmin} />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-500 font-semibold mb-2">Failed to load profile</p>
            <button onClick={() => router.back()} className="text-primary hover:underline">
              Go back
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navigation isAdmin={isAdmin} />

      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-sm border-b border-border px-4 py-4 flex items-center justify-between">
        <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-lg transition">
          <ArrowLeft size={20} className="text-muted-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground flex-1 text-center truncate px-2">
          {profile?.name || 'Loading...'}
        </h1>
        <div className="w-8"></div>
      </div>

      {/* Profile Info */}
      {profile && (
        <div className="px-4 py-6 bg-card/50 border-b border-border">
          <div className="flex items-center gap-4 mb-4">
            {profile.logo_url ? (
              <img
                src={profile.logo_url}
                alt={profile.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-muted" />
            )}
            <div className="flex-1">
              <h2 className="text-lg font-bold text-foreground mb-1">{profile.name}</h2>
              <p className="text-sm text-muted-foreground">{profile.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="px-4 py-4 border-b border-border flex gap-2 overflow-x-auto">
        {(['all', 'manual', 'automatic'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filterType === type
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {type === 'all' && 'All'}
            {type === 'manual' && `Manual (${manualCount})`}
            {type === 'automatic' && `Auto (${automaticCount})`}
          </button>
        ))}
      </div>

      {/* Missions List */}
      <div className="px-4 py-6 space-y-3">
        {filteredMissions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No missions found</p>
          </div>
        ) : (
          filteredMissions.map((mission) => {
            const isManual = mission.verification_type?.toLowerCase() === 'manual'
            const missionStatus = getMissionStatus(
              mission.start_date,
              mission.start_time,
              mission.end_date,
              mission.end_time,
              mission.completion_status
            )
            const isLocked = missionStatus.state === 'locked'
            const isExpired = missionStatus.state === 'expired'
            const isCompleted = missionStatus.state === 'completed'
            const isPendingReview = missionStatus.state === 'pending_review'
            
            return (
              <div
                key={mission.id}
                onClick={() => !isLocked && router.push(`/missions/${mission.id}`)}
                className={`bg-card border rounded-lg p-4 transition-all group ${
                  isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5'
                } ${
                  isCompleted || isExpired
                    ? 'border-border opacity-60' 
                    : isLocked
                    ? 'border-border/60'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="inline-block px-2.5 py-1 bg-accent/20 rounded text-xs font-bold text-accent">
                        {mission.category?.toUpperCase() || 'GENERAL'}
                      </span>
                      {mission.image_url && (
                        <img 
                          src={mission.image_url} 
                          alt="mission logo"
                          className="h-5 w-5 rounded object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-bold ${!isLocked ? 'group-hover:text-primary transition' : ''} ${
                        isCompleted || isExpired ? 'text-muted-foreground line-through' : isLocked ? 'text-muted-foreground' : 'text-foreground'
                      }`}>
                        {mission.title}
                      </h3>
                      {isCompleted && (
                        <Check size={18} className="text-accent flex-shrink-0" />
                      )}
                      {isPendingReview && (
                        <Clock size={18} className="text-yellow-500 flex-shrink-0 animate-pulse" />
                      )}
                      {isLocked && (
                        <Lock size={18} className="text-muted-foreground flex-shrink-0" />
                      )}
                      {isExpired && (
                        <span className="text-xs font-bold text-red-500">EXPIRED</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {mission.description}
                    </p>
                    {isLocked && (
                      <p className="text-xs text-yellow-600 mt-2 font-semibold">
                        🔒 Available in {countdown[mission.id] || formatTimeRemaining(missionStatus.timeUntilAvailable || 0)}
                      </p>
                    )}
                    {isExpired && (
                      <p className="text-xs text-red-500 mt-2 font-semibold">
                        ⏱️ Time limit expired
                      </p>
                    )}
                  </div>
                  <ChevronRight size={20} className="text-muted-foreground group-hover:text-primary transition mt-1 flex-shrink-0" />
                </div>

                {/* Rewards */}
                <div className="flex gap-3 text-xs font-semibold">
                  <span className="text-accent">+{mission.xp_reward} XP</span>
                  <span className="text-primary">+{mission.zeryt_reward} ZeryT</span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
