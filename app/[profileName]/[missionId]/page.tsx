'use client'

import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Navigation } from '@/components/Navigation'
import { ArrowLeft, Upload, Check } from 'lucide-react'
import useSWR from 'swr'
import { useEffect, useState } from 'react'
import { getMissionStatus } from '@/lib/mission-status'

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
  start_date?: string
  start_time?: string
  end_date?: string
  end_time?: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function MissionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [missionId, setMissionId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionUrl, setSubmissionUrl] = useState('')
  const [submissionError, setSubmissionError] = useState('')

  useEffect(() => {
    if (params && params.missionId) {
      const id = Array.isArray(params.missionId) ? params.missionId[0] : params.missionId
      setMissionId(id as string)
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

  // Fetch mission details
  const { data: mission, error: missionError } = useSWR<Mission>(
    missionId ? `/api/missions/${missionId}` : null,
    fetcher
  )

  if (authLoading || !user || !missionId) {
    return (
      <div className="min-h-screen bg-background pb-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading mission...</p>
        </div>
      </div>
    )
  }

  if (missionError || !mission) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <Navigation isAdmin={isAdmin} />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-500 font-semibold mb-2">Failed to load mission</p>
            <button onClick={() => router.back()} className="text-primary hover:underline">
              Go back
            </button>
          </div>
        </div>
      </div>
    )
  }

  const missionStatus = getMissionStatus(
    mission.start_date,
    mission.start_time,
    mission.end_date,
    mission.end_time,
    mission.completion_status
  )

  const handleSubmitMission = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmissionError('')
    
    if (!submissionUrl.trim()) {
      setSubmissionError('Please provide proof of mission completion')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/missions/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mission_id: missionId,
          user_id: user?.id,
          submission_data: { proof_url: submissionUrl },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setSubmissionError(data.error || 'Failed to submit mission')
        return
      }

      // Success - show confirmation
      setSubmissionUrl('')
      alert('Mission submitted for verification!')
      // Optionally refetch mission data
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : 'Submission failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navigation isAdmin={isAdmin} />

      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-sm border-b border-border px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-lg transition flex-shrink-0">
          <ArrowLeft size={20} className="text-muted-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground truncate">
          {mission.title}
        </h1>
      </div>

      {/* Mission Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Image */}
        {mission.image_url && (
          <div className="w-full h-48 rounded-lg overflow-hidden bg-muted">
            <img
              src={mission.image_url}
              alt={mission.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Category Badge */}
        <div>
          <span className="inline-block px-3 py-1 bg-accent/20 rounded text-sm font-bold text-accent">
            {mission.category?.toUpperCase() || 'GENERAL'}
          </span>
        </div>

        {/* Title & Description */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">{mission.title}</h2>
          <p className="text-muted-foreground">{mission.description}</p>
        </div>

        {/* Rewards */}
        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          <h3 className="font-bold text-foreground mb-3">Rewards</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">XP</span>
              <span className="font-bold text-accent">+{mission.xp_reward}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">ZeryT</span>
              <span className="font-bold text-primary">+{mission.zeryt_reward}</span>
            </div>
          </div>
        </div>

        {/* Verification Type */}
        {mission.verification_type && (
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-bold text-foreground mb-2">Verification Type</h3>
            <p className="text-muted-foreground capitalize">
              {mission.verification_type.replace(/_/g, ' ')}
            </p>
          </div>
        )}

        {/* Status */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-bold text-foreground mb-2">Status</h3>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="text-muted-foreground">State: </span>
              <span className="capitalize font-semibold">{missionStatus.state}</span>
            </p>
            {missionStatus.timeRemaining && (
              <p className="text-sm">
                <span className="text-muted-foreground">Time Remaining: </span>
                <span className="font-semibold">{missionStatus.timeRemaining}</span>
              </p>
            )}
          </div>
        </div>

        {/* Mission Submission Form */}
        {missionStatus.state === 'available' && mission.completion_status === 'not_started' && (
          <form onSubmit={handleSubmitMission} className="space-y-4 bg-card border border-border rounded-lg p-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {mission.verification_type === 'manual' ? 'Proof of Completion' : 'Submission URL'}
              </label>
              <input
                type="text"
                placeholder={mission.verification_type === 'manual' ? 'Paste link/screenshot URL' : 'https://example.com/proof'}
                value={submissionUrl}
                onChange={(e) => setSubmissionUrl(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {submissionError && (
              <p className="text-red-500 text-sm">{submissionError}</p>
            )}
            <button
              type="submit"
              disabled={isSubmitting || !submissionUrl.trim()}
              className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:bg-primary/90 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Submit Mission
                </>
              )}
            </button>
          </form>
        )}
        {missionStatus.state === 'locked' && (
          <button disabled className="w-full bg-muted text-muted-foreground font-bold py-3 rounded-lg opacity-60 cursor-not-allowed">
            Coming Soon
          </button>
        )}
        {mission.completion_status === 'pending_review' && (
          <button disabled className="w-full bg-yellow-500/20 text-yellow-700 font-bold py-3 rounded-lg flex items-center justify-center gap-2">
            <Clock size={18} />
            Pending Review
          </button>
        )}
        {(missionStatus.state === 'completed' || mission.completion_status === 'completed') && (
          <button disabled className="w-full bg-accent/20 text-accent font-bold py-3 rounded-lg flex items-center justify-center gap-2">
            <Check size={18} />
            Completed
          </button>
        )}
      </div>
    </div>
  )
}
