'use client'

import React from 'react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Navigation } from '@/components/Navigation'
import { ArrowLeft, Plus } from 'lucide-react'
import Link from 'next/link'
import useSWR from 'swr'

interface Mission {
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
  category?: string
  image_url?: string
  recurrence?: string
  max_completions?: number
  start_date?: string
  end_date?: string
  schedule_start_time?: string
  schedule_end_time?: string
  time_limited?: boolean
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

interface MissionProfile {
  id: string
  name: string
}

interface MissionVerification {
  verification_type: 'automatic' | 'text' | 'image' | 'link'
  text_label?: string
  text_example?: string
  image_example_url?: string
  link_domain?: string
  link_description?: string
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error('Failed to fetch')
    return res.json()
  })

export default function CreateMissionPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [verifications, setVerifications] = useState<MissionVerification[]>([
    { verification_type: 'automatic' }
  ])
  const [formData, setFormData] = useState<Partial<Mission>>({
    title: '',
    description: '',
    brief: '',
    mission_profile_id: '',
    mission_type_id: '',
    social_network_id: '',
    website_url: '',
    verification_type: 'manual',
    xp_reward: 0,
    zeryt_reward: 0,
    priority: 'normal',
    status: 'active',
    category: '',
    image_url: '',
    recurrence: 'once',
    max_completions: 0,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    schedule_start_time: '00:00',
    schedule_end_time: '23:59',
    time_limited: false,
  })

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth/login')
      } else {
        setIsAdmin(true)
      }
    }
  }, [user, authLoading, router])

  const { data: missionTypes } = useSWR<MissionType[]>(
    isAdmin ? '/api/mission-types' : null,
    fetcher
  )

  const { data: socialNetworks } = useSWR<SocialNetwork[]>(
    isAdmin ? '/api/social-networks' : null,
    fetcher
  )

  const { data: profiles } = useSWR<MissionProfile[]>(
    isAdmin ? '/api/mission-profiles' : null,
    fetcher
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: name === 'xp_reward' || name === 'zeryt_reward' ? Number(value) : value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      if (!formData.title || !formData.mission_profile_id || !formData.mission_type_id) {
        throw new Error('Title, Profile, and Type are required')
      }

      const res = await fetch('/api/admin/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create mission')
      }

      const missionData = await res.json()

      // Create mission verifications
      for (const verification of verifications) {
        await fetch(`/api/admin/mission-verifications/${missionData.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(verification),
        })
      }

      router.push('/admin/missions')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAdmin) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation isAdmin={isAdmin} />

      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-sm border-b border-border px-4 py-4 flex items-center justify-between">
        <Link href="/admin/missions" className="p-2 hover:bg-muted rounded-lg transition inline-flex">
          <ArrowLeft size={20} className="text-muted-foreground" />
        </Link>
        <h1 className="text-lg font-bold text-foreground">Create Mission</h1>
        <div className="w-8"></div>
      </div>

      <div className="max-w-2xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="bg-card rounded-lg border border-border p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Mission title"
                required
                className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">Brief</label>
              <textarea
                name="brief"
                value={formData.brief}
                onChange={handleInputChange}
                placeholder="Short description"
                className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Full description"
                className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-2">Profile *</label>
                <select
                  name="mission_profile_id"
                  value={formData.mission_profile_id}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="">Select Profile</option>
                  {profiles?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-2">Type *</label>
                <select
                  name="mission_type_id"
                  value={formData.mission_type_id}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="">Select Type</option>
                  {missionTypes?.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-2">XP Reward</label>
                <input
                  type="number"
                  name="xp_reward"
                  value={formData.xp_reward}
                  onChange={handleInputChange}
                  className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-2">ZeryT Reward</label>
                <input
                  type="number"
                  name="zeryt_reward"
                  value={formData.zeryt_reward}
                  onChange={handleInputChange}
                  className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-2">Priority</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-2">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">Social Network</label>
              <select
                name="social_network_id"
                value={formData.social_network_id}
                onChange={handleInputChange}
                className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary"
              >
                <option value="">None</option>
                {socialNetworks?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">Website URL</label>
              <input
                type="url"
                name="website_url"
                value={formData.website_url}
                onChange={handleInputChange}
                placeholder="https://example.com"
                className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Verification Section */}
          <div className="bg-card rounded-lg border border-border p-6 space-y-4">
            <h3 className="font-semibold text-foreground mb-4">Verification Type</h3>

            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">Select Verification Method</label>
              <select
                value={formData.verification_type || 'automatic'}
                onChange={(e) => {
                  const newType = e.target.value as 'automatic' | 'text' | 'image' | 'link'
                  setFormData({ ...formData, verification_type: newType })
                  setVerifications([{ verification_type: newType }])
                }}
                className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary"
              >
                <option value="automatic">Automatic (No manual verification)</option>
                <option value="text">Text Input (User enters text)</option>
                <option value="image">Image Upload (User uploads proof)</option>
                <option value="link">Link Submission (User submits URL)</option>
              </select>
            </div>

            {verifications[0]?.verification_type === 'text' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-muted-foreground mb-2">Expected Text Label</label>
                  <input
                    type="text"
                    placeholder="e.g., Your Username, Screenshot Description"
                    value={verifications[0]?.text_label || ''}
                    onChange={(e) =>
                      setVerifications([{ ...verifications[0], text_label: e.target.value }])
                    }
                    className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-muted-foreground mb-2">Example/Hint</label>
                  <textarea
                    placeholder="e.g., Enter your Twitter handle exactly as shown on your profile"
                    value={verifications[0]?.text_example || ''}
                    onChange={(e) =>
                      setVerifications([{ ...verifications[0], text_example: e.target.value }])
                    }
                    className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                    rows={2}
                  />
                </div>
              </>
            )}

            {verifications[0]?.verification_type === 'image' && (
              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-2">Example Image URL</label>
                <input
                  type="url"
                  placeholder="https://example.com/example-image.jpg"
                  value={verifications[0]?.image_example_url || ''}
                  onChange={(e) =>
                    setVerifications([{ ...verifications[0], image_example_url: e.target.value }])
                  }
                  className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>
            )}

            {verifications[0]?.verification_type === 'link' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-muted-foreground mb-2">Required Domain</label>
                  <input
                    type="text"
                    placeholder="e.g., twitter.com, github.com"
                    value={verifications[0]?.link_domain || ''}
                    onChange={(e) =>
                      setVerifications([{ ...verifications[0], link_domain: e.target.value }])
                    }
                    className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-muted-foreground mb-2">Link Description</label>
                  <textarea
                    placeholder="e.g., Link to your GitHub profile showing contributions"
                    value={verifications[0]?.link_description || ''}
                    onChange={(e) =>
                      setVerifications([{ ...verifications[0], link_description: e.target.value }])
                    }
                    className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                    rows={2}
                  />
                </div>
              </>
            )}

            {verifications[0]?.verification_type === 'automatic' && (
              <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
                <p className="text-sm text-foreground">Mission will be completed automatically when submitted. No manual verification needed.</p>
              </div>
            )}
          </div>

          {/* Scheduling & Limits Section */}
          <div className="bg-card rounded-lg border border-border p-6 space-y-4">
            <h3 className="font-semibold text-foreground mb-4">Scheduling & Limits</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-2">Recurrence</label>
                <select
                  name="recurrence"
                  value={formData.recurrence}
                  onChange={handleInputChange}
                  className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="once">One-Time</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-2">Max Completions (0 = unlimited)</label>
                <input
                  type="number"
                  name="max_completions"
                  value={formData.max_completions}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-2">Start Date</label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-2">End Date</label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-2">Start Time (HH:MM)</label>
                <input
                  type="time"
                  name="schedule_start_time"
                  value={formData.schedule_start_time || '00:00'}
                  onChange={handleInputChange}
                  className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-2">End Time (HH:MM)</label>
                <input
                  type="time"
                  name="schedule_end_time"
                  value={formData.schedule_end_time || '23:59'}
                  onChange={handleInputChange}
                  className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="time_limited"
                  checked={formData.time_limited}
                  onChange={(e) => setFormData((prev) => ({ ...prev, time_limited: e.target.checked }))}
                  className="w-4 h-4 border border-border rounded"
                />
                <span className="text-sm font-semibold text-muted-foreground">Time Limited (disable completion after end date)</span>
              </label>
            </div>
          </div>

          {/* Additional Details Section */}
          <div className="bg-card rounded-lg border border-border p-6 space-y-4">
            <h3 className="font-semibold text-foreground mb-4">Additional Details</h3>

            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">Category</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                placeholder="Mission category (optional)"
                className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">Image URL</label>
              <input
                type="url"
                name="image_url"
                value={formData.image_url}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
                className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Link
              href="/admin/missions"
              className="px-6 py-2 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-lg transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground font-semibold rounded-lg transition flex items-center gap-2"
            >
              <Plus size={18} />
              Create Mission
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
