'use client'

import React from 'react'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Navigation } from '@/components/Navigation'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import useSWR from 'swr'

interface Mission {
  id: string
  title: string
  description: string
  brief: string
  mission_profile_id: string
  mission_type_id: string
  social_network_id?: string
  website_url?: string
  verification_type: string
  xp_reward: number
  zeryt_reward: number
  priority: string
  status: string
  start_date?: string
  end_date?: string
  start_time?: string
  end_time?: string
}

interface MissionType {
  id: string
  name: string
  slug: string
  verification_method: 'auto' | 'manual'
}

interface SocialNetwork {
  id: string
  name: string
  slug: string
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error('Failed to fetch')
    return res.json()
  })

export default function EditMissionPage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<Partial<Mission> | null>(null)

  const missionId = params?.id as string

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth/login')
      } else if (user.email !== 'remgoficial@gmail.com') {
        router.push('/')
      } else {
        setIsAdmin(true)
      }
    }
  }, [user, authLoading, router])

  const { data: mission, error: missionError } = useSWR<Mission>(
    isAdmin && missionId ? `/api/missions/${missionId}` : null,
    fetcher
  )

  const { data: missionTypes } = useSWR<MissionType[]>(
    isAdmin ? '/api/mission-types' : null,
    fetcher
  )

  const { data: socialNetworks } = useSWR<SocialNetwork[]>(
    isAdmin ? '/api/social-networks' : null,
    fetcher
  )

  useEffect(() => {
    if (mission && !formData) {
      setFormData(mission)
    }
  }, [mission, formData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      if (!formData) {
        throw new Error('No mission data')
      }

      const res = await fetch(`/api/admin/missions/${missionId}/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to update mission')
      }

      router.push('/admin/missions')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading || !isAdmin || !formData) {
    return null
  }

  const selectedType = missionTypes?.find((t) => t.id === formData.mission_type_id)
  const isSocialMission = selectedType?.slug?.includes('social') || selectedType?.slug === 'twitter'

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navigation isAdmin={isAdmin} />

      {/* Header */}
      <div className="px-4 pt-6 mb-6">
        <Link
          href="/admin/missions"
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 text-sm font-semibold mb-4"
        >
          <ArrowLeft size={16} />
          Back to Missions
        </Link>
        <h1 className="text-2xl font-bold text-foreground mb-1">Edit Mission</h1>
        <p className="text-sm text-muted-foreground">{formData.title}</p>
      </div>

      {/* Form */}
      <div className="px-4 max-w-3xl">
        {missionError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-400">Failed to load mission. Please try again.</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <label className="block text-sm font-semibold text-white mb-2">
              Title
            </label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  title: e.target.value,
                }))
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-teal-500 focus:outline-none transition"
            />
          </div>

          {/* Description */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <label className="block text-sm font-semibold text-white mb-2">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-teal-500 focus:outline-none transition min-h-24"
            />
          </div>

          {/* Rewards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <label className="block text-sm font-semibold text-white mb-2">
                XP Reward
              </label>
              <input
                type="number"
                value={formData.xp_reward || 0}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    xp_reward: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-teal-500 focus:outline-none transition"
              />
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <label className="block text-sm font-semibold text-white mb-2">
                ZeryT Reward
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.zeryt_reward || 0}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    zeryt_reward: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-teal-500 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <label className="block text-sm font-semibold text-white mb-2">
                Status
              </label>
              <select
                value={formData.status || 'active'}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: e.target.value,
                  }))
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-teal-500 focus:outline-none transition"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <label className="block text-sm font-semibold text-white mb-2">
                Priority
              </label>
              <select
                value={formData.priority || 'normal'}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    priority: e.target.value,
                  }))
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-teal-500 focus:outline-none transition"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Start and End Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <label className="block text-sm font-semibold text-white mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.start_date || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    start_date: e.target.value,
                  }))
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-teal-500 focus:outline-none transition"
              />
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <label className="block text-sm font-semibold text-white mb-2">
                End Date
              </label>
              <input
                type="date"
                value={formData.end_date || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    end_date: e.target.value,
                  }))
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-teal-500 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Social Network (if applicable) */}
          {isSocialMission && socialNetworks && socialNetworks.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <label className="block text-sm font-semibold text-white mb-2">
                Social Network
              </label>
              <select
                value={formData.social_network_id || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    social_network_id: e.target.value,
                  }))
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-teal-500 focus:outline-none transition"
              >
                <option value="">-- Select Network --</option>
                {socialNetworks.map((network) => (
                  <option key={network.id} value={network.id}>
                    {network.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            <Save size={18} />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
