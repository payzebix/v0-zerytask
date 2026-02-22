'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Navigation } from '@/components/Navigation'
import { ArrowLeft } from 'lucide-react'
import useSWR from 'swr'

interface MissionProfile {
  id: string
  name: string
  description: string
  logo_url?: string
  icon_url?: string
  website_url?: string
  status: string
  total_xp_reward: number
  total_zeryt_reward: number
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function EditMissionProfilePage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo_url: '',
    website_url: '',
    status: 'active',
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
    if (user?.email === 'remgoficial@gmail.com') {
      setIsAdmin(true)
    }
  }, [user, authLoading, router])

  // Don't fetch if params.id is "create" (that's a static route)
  const isCreateRoute = params?.id === 'create'
  const { data: profile, isLoading } = useSWR<MissionProfile>(
    isAdmin && params?.id && !isCreateRoute ? `/api/mission-profiles/${params.id}` : null,
    fetcher
  )

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        description: profile.description || '',
        logo_url: profile.logo_url || '',
        website_url: profile.website_url || '',
        status: profile.status || 'active',
      })
    }
  }, [profile])

  if (authLoading || isLoading) {
    return null
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation isAdmin={isAdmin} />
        <div className="text-center py-12">
          <p className="text-destructive">Access denied</p>
        </div>
      </div>
    )
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Profile name is required')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      const res = await fetch(`/api/mission-profiles/${params?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        throw new Error('Failed to save profile')
      }

      router.push('/admin/mission-profiles')
    } catch (err: any) {
      setError(err.message || 'Failed to save profile')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navigation isAdmin={isAdmin} />

      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-sm border-b border-border px-4 py-4 flex items-center justify-between">
        <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-lg transition">
          <ArrowLeft size={20} className="text-muted-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground flex-1 text-center">Edit Mission Profile</h1>
        <div className="w-8"></div>
      </div>

      {/* Form */}
      <div className="px-4 py-6 max-w-2xl mx-auto">
        <div className="bg-card rounded-xl border border-border p-6 space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-muted-foreground mb-2">
              Profile Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition"
              placeholder="Enter profile name"
              disabled={isSaving}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-muted-foreground mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition resize-none"
              rows={4}
              placeholder="Enter profile description"
              disabled={isSaving}
            />
          </div>

          {/* Logo URL */}
          <div>
            <label className="block text-sm font-semibold text-muted-foreground mb-2">
              Logo URL
            </label>
            <input
              type="url"
              value={formData.logo_url}
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition"
              placeholder="https://example.com/logo.png"
              disabled={isSaving}
            />
          </div>

          {/* Website URL */}
          <div>
            <label className="block text-sm font-semibold text-muted-foreground mb-2">
              Website URL
            </label>
            <input
              type="url"
              value={formData.website_url}
              onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
              className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition"
              placeholder="https://example.com"
              disabled={isSaving}
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-muted-foreground mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary transition"
              disabled={isSaving}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => router.back()}
              disabled={isSaving}
              className="flex-1 bg-muted hover:bg-muted/80 disabled:opacity-50 text-foreground font-semibold px-4 py-3 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-semibold px-4 py-3 rounded-lg transition"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
