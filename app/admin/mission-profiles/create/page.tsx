'use client'

import React from "react"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Navigation } from '@/components/Navigation'
import { ImageUpload } from '@/components/ImageUpload'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface FormData {
  name: string
  description: string
  logo_url: string
  category_id?: string
  status: 'active' | 'inactive' | 'archived'
}

interface Category {
  id: string
  name: string
  icon_url?: string
}

export default function CreateProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [logoPreview, setLogoPreview] = useState<string>('')
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    logo_url: '',
    status: 'active',
  })

  // Load categories on mount
  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/admin/mission-categories')
        if (res.ok) {
          const data = await res.json()
          setCategories(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        console.error('[v0] Error fetching categories:', err)
      } finally {
        setLoadingCategories(false)
      }
    }
    fetchCategories()
  }, [])

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

  const handleLogoUploadComplete = (url: string, filename?: string) => {
    setFormData((prev) => ({
      ...prev,
      logo_url: url,
    }))
    setLogoPreview(url)
  }

  const handleLogoRemove = () => {
    setLogoPreview('')
    setFormData((prev) => ({ ...prev, logo_url: '' }))
  }

  const handleLogoUploadError = (errorMsg: string) => {
    setError(errorMsg)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/mission-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to create profile')
      }

      const data = await res.json()
      router.push('/admin/mission-profiles')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading || !isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navigation isAdmin={isAdmin} />

      {/* Header */}
      <div className="px-4 pt-6 mb-6">
        <Link
          href="/admin/mission-profiles"
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 text-sm font-semibold mb-4"
        >
          <ArrowLeft size={16} />
          Back to Profiles
        </Link>
        <h1 className="text-2xl font-bold text-foreground mb-1">Create Mission Profile</h1>
        <p className="text-sm text-muted-foreground">Define a brand profile for your missions</p>
      </div>

      {/* Form */}
      <div className="px-4 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo Upload */}
          <div className="bg-card rounded-lg border border-border p-6">
            <label className="block text-sm font-semibold text-foreground mb-4">
              Profile Logo
            </label>
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : (
              <ImageUpload
                onUploadComplete={handleLogoUploadComplete}
                onError={handleLogoUploadError}
                endpoint="/api/upload"
                preview={logoPreview}
                onRemove={handleLogoRemove}
                label="Upload Logo"
              />
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Profile Name *
            </label>
            <input
              type="text"
              placeholder="e.g., Web3 Community"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none transition"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Description
            </label>
            <textarea
              placeholder="Describe this profile and what missions it includes..."
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={4}
              className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none transition resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-foreground">
                Category
              </label>
              <Link
                href="/admin/mission-categories"
                className="text-xs text-primary hover:text-primary/80 font-medium"
              >
                Manage Categories →
              </Link>
            </div>
            {categories.length === 0 ? (
              <div className="bg-muted/50 border border-border rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-3">No categories available</p>
                <Link
                  href="/admin/mission-categories"
                  className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2 rounded-lg transition text-sm"
                >
                  Create First Category
                </Link>
              </div>
            ) : (
              <select
                value={formData.category_id || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    category_id: e.target.value || undefined,
                  }))
                }
                disabled={loadingCategories}
                className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground focus:border-primary focus:outline-none transition disabled:opacity-50"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  status: e.target.value as FormData['status'],
                }))
              }
              className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground focus:border-primary focus:outline-none transition"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Link
              href="/admin/mission-profiles"
              className="flex-1 bg-muted hover:bg-muted/80 text-foreground font-semibold px-4 py-3 rounded-lg transition text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading || !formData.name}
              className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground font-semibold px-4 py-3 rounded-lg transition"
            >
              {isLoading ? 'Creating...' : 'Create Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
