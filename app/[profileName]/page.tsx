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
  const [profileName, setProfileName] = useState<string | null>(null)

  // Extract profileName from URL
  useEffect(() => {
    if (params && params.profileName) {
      const name = Array.isArray(params.profileName) ? params.profileName[0] : params.profileName
      setProfileName(decodeURIComponent(name as string))
      console.log('[v0] Profile name from URL:', decodeURIComponent(name as string))
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

  // Fetch profile by name
  const { data: profileData, error: profileError } = useSWR<MissionProfile>(
    profileName ? `/api/mission-profiles/by-name/${encodeURIComponent(profileName)}` : null,
    fetcher
  )

  // Set profileId once we have profile data
  useEffect(() => {
    if (profileData?.id) {
      setProfileId(profileData.id)
      console.log('[v0] Got profile ID:', profileData.id)
    }
  }, [profileData])

  // Fetch missions for this profile
  const { data: missionsData, error: missionsError } = useSWR<Mission[]>(
    profileId ? `/api/missions/by-profile/${profileId}` : null,
    fetcher
  )

  const allMissions = Array.isArray(missionsData) ? missionsData : []
  const profile = profileData as MissionProfile | undefined

  // Organize missions by status
  const organizeMissionsByStatus = (missions: Mission[]) => {
    const available: Mission[] = []
    const inProgress: Mission[] = []
    const paused: Mission[] = []
    const completed: Mission[] = []

    missions.forEach(mission => {
      const status = getMissionStatus(
        mission.start_date,
        mission.start_time,
        mission.end_date,
        mission.end_time,
        mission.completion_status
      )

      if (mission.completion_status === 'completed') {
        completed.push(mission)
      } else if (mission.status === 'paused') {
        paused.push(mission)
      } else if (status.state === 'available' || status.state === 'in_progress') {
        if (status.state === 'available') {
          available.push(mission)
        } else {
          inProgress.push(mission)
        }
      }
    })

    return { available, inProgress, paused, completed }
  }

  // Filter by verification type
  const filterByType = (missions: Mission[]) => {
    if (filterType === 'all') return missions
    const isManual = (m: Mission) => m.verification_type?.toLowerCase() === 'manual'
    return filterType === 'manual' ? missions.filter(isManual) : missions.filter(m => !isManual(m))
  }

  const filteredMissions = filterByType(allMissions)
  const missionsByStatus = organizeMissionsByStatus(filteredMissions)

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

  // Render individual mission card
  const renderMissionCard = (mission: Mission) => {
    const status = getMissionStatus(
      mission.start_date,
      mission.start_time,
      mission.end_date,
      mission.end_time,
      mission.completion_status
    )

    const statusIcon = status.state === 'completed' ? (
      <Check size={16} className="text-green-500" />
    ) : status.state === 'locked' ? (
      <Lock size={16} className="text-muted-foreground" />
    ) : status.state === 'in_progress' ? (
      <Clock size={16} className="text-yellow-500" />
    ) : null

    const statusText = status.state === 'completed' ? 'Completed' : status.state === 'locked' ? 'Locked' : status.state === 'in_progress' ? 'Ending soon' : ''

    return (
      <div
        key={mission.id}
        onClick={() => router.push(`/${encodeURIComponent(profile?.name || '')  }/${mission.id}`)}
        className="bg-card border border-border hover:border-primary/50 rounded-xl p-3 transition cursor-pointer hover:bg-card/80 group"
      >
        <div className="flex gap-2 items-start">
          {mission.image_url && (
            <img 
              src={mission.image_url} 
              alt="mission logo"
              className="h-6 w-6 rounded object-cover flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm group-hover:text-primary transition truncate">{mission.title}</h3>
            <p className="text-xs text-muted-foreground line-clamp-1">{mission.description}</p>
            <div className="flex gap-2 mt-2 text-xs">
              <span className="bg-primary/10 text-primary px-2 py-1 rounded">+{mission.xp_reward} XP</span>
              {mission.zeryt_reward > 0 && (
                <span className="bg-accent/10 text-accent px-2 py-1 rounded">${mission.zeryt_reward}</span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {statusIcon && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {statusIcon}
                <span>{statusText}</span>
              </div>
            )}
            <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition" />
          </div>
        </div>
      </div>
    )
  }

  if (authLoading || !user || !profileName) {
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
            <p className="text-red-500 font-semibold mb-2">Profile not found: {profileName}</p>
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
          <div className="flex items-start gap-3 mb-4">
            {profile.logo_url ? (
              <img
                src={profile.logo_url}
                alt={profile.name}
                className="w-12 h-12 flex-shrink-0 rounded-xl object-cover"
              />
            ) : (
              <div className="w-12 h-12 flex-shrink-0 rounded-xl bg-muted" />
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-foreground mb-1 truncate">{profile.name}</h2>
              <p className="text-sm text-muted-foreground line-clamp-2">{profile.description}</p>
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

      {/* Missions List - Organized by Status */}
      <div className="px-4 py-6 space-y-6">
        {filteredMissions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No missions found</p>
          </div>
        ) : (
          <>
            {/* Available Missions */}
            {missionsByStatus.available.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-primary uppercase tracking-wide mb-3">Available Now</h3>
                <div className="space-y-3">
                  {missionsByStatus.available.map((mission) => (
                    renderMissionCard(mission)
                  ))}
                </div>
              </div>
            )}

            {/* In Progress Missions */}
            {missionsByStatus.inProgress.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-accent uppercase tracking-wide mb-3">In Progress</h3>
                <div className="space-y-3">
                  {missionsByStatus.inProgress.map((mission) => (
                    renderMissionCard(mission)
                  ))}
                </div>
              </div>
            )}

            {/* Paused Missions */}
            {missionsByStatus.paused.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-yellow-600 uppercase tracking-wide mb-3">Paused</h3>
                <div className="space-y-3">
                  {missionsByStatus.paused.map((mission) => (
                    renderMissionCard(mission)
                  ))}
                </div>
              </div>
            )}

            {/* Completed Missions */}
            {missionsByStatus.completed.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">Completed</h3>
                <div className="space-y-3 opacity-75">
                  {missionsByStatus.completed.map((mission) => (
                    renderMissionCard(mission)
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )

  // Helper function to render mission card
  const renderMissionCard = (mission: Mission) => {
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
                onClick={() => !isLocked && router.push(`/${encodeURIComponent(profileName || '')}/${mission.id}`)}
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
                          className="h-6 w-6 rounded object-cover flex-shrink-0"
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
  }
}
