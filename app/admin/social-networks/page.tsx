'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/Navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Plus, Edit2, Trash2, Loader2, Upload, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import useSWR from 'swr'

interface SocialNetwork {
  id: string
  name: string
  icon_url?: string
  is_custom: boolean
  verification_method?: string
  created_at: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function SocialNetworksPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingNetwork, setEditingNetwork] = useState<SocialNetwork | null>(null)
  const [loading, setLoading] = useState(false)
  const [iconPreview, setIconPreview] = useState<string>('')
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    icon_url: '',
    color: '#000000',
    verification_method: 'automatic',
  })

  const { data: networks = [], mutate } = useSWR<SocialNetwork[]>(
    '/api/social-networks',
    fetcher
  )

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

  const handleIconUpload = async (file: File) => {
    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      formDataUpload.append('path', `social-networks/${Date.now()}-${file.name}`)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      })

      if (res.ok) {
        const data = await res.json()
        setFormData((prev) => ({
          ...prev,
          icon_url: data.url,
        }))
        setIconPreview(data.url)
      }
    } catch (err) {
      console.error('[v0] Error uploading icon:', err)
      alert('Error uploading icon')
    }
  }

  const handleSave = async () => {
    if (!formData.name) {
      alert('Name is required')
      return
    }

    setLoading(true)
    try {
      const method = editingNetwork ? 'PUT' : 'POST'
      const url = editingNetwork
        ? `/api/admin/social-networks/${editingNetwork.id}`
        : '/api/admin/social-networks'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error saving network')
      }

      alert(editingNetwork ? 'Network updated' : 'Network created')
      setShowForm(false)
      setEditingNetwork(null)
      setFormData({
        name: '',
        slug: '',
        icon_url: '',
        color: '#000000',
        verification_method: 'automatic',
      })
      setIconPreview('')
      mutate()
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (network: SocialNetwork) => {
    setEditingNetwork(network)
    setFormData({
      name: network.name,
      icon_url: network.icon_url || '',
      verification_method: network.verification_method || 'automatic',
    })
    setIconPreview(network.icon_url || '')
    setShowForm(true)
  }

  const handleDelete = async (networkId: string) => {
    if (!confirm('Are you sure you want to delete this network?')) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/social-networks/${networkId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error deleting network')
      }

      alert('Network deleted')
      mutate()
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || !isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 pb-20">
      <Navigation isAdmin={isAdmin} />

      {/* Header */}
      <div className="sticky top-0 bg-slate-950/80 backdrop-blur-sm border-b border-slate-800 px-4 py-4 z-20">
        <div className="max-w-6xl mx-auto">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 text-sm font-semibold mb-4"
          >
            <ArrowLeft size={16} />
            Back to Admin
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Social Networks</h1>
              <p className="text-sm text-slate-400">Manage social networks and custom verification methods</p>
            </div>
            <Button
              onClick={() => {
                setEditingNetwork(null)
                setFormData({
                  name: '',
                  slug: '',
                  icon_url: '',
                  color: '#000000',
                  verification_method: 'automatic',
                })
                setIconPreview('')
                setShowForm(true)
              }}
              className="bg-teal-600 hover:bg-teal-700 gap-2"
            >
              <Plus size={18} />
              New Network
            </Button>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingNetwork ? 'Edit Network' : 'New Social Network'}
            </h2>
            <div className="space-y-4">
              {/* Icon Upload */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Icon</label>
                {iconPreview ? (
                  <div className="mb-3">
                    <img
                      src={iconPreview || "/placeholder.svg"}
                      alt="Icon preview"
                      className="w-20 h-20 rounded-lg object-cover bg-slate-900 border border-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIconPreview('')
                        setFormData((prev) => ({ ...prev, icon_url: '' }))
                      }}
                      className="mt-2 text-sm text-red-400 hover:text-red-300 font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-teal-500 transition">
                    <div className="flex flex-col items-center justify-center py-2">
                      <Upload size={20} className="text-gray-400 mb-1" />
                      <p className="text-xs text-gray-400">Upload icon</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleIconUpload(file)
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Twitter"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      name: e.target.value,
                      slug: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                    }))
                  }
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Slug *</label>
                <input
                  type="text"
                  placeholder="e.g., twitter"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      slug: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                    }))
                  }
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Brand Color</label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      color: e.target.value,
                    }))
                  }
                  className="w-full h-10 rounded cursor-pointer"
                />
              </div>

              {/* Verification Method */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Verification</label>
                <select
                  value={formData.verification_method}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      verification_method: e.target.value,
                    }))
                  }
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="automatic">Automatic</option>
                  <option value="manual">Manual</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 bg-teal-600 hover:bg-teal-700"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                </Button>
                <Button
                  onClick={() => {
                    setShowForm(false)
                    setEditingNetwork(null)
                  }}
                  className="flex-1 bg-slate-700 hover:bg-slate-600"
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {networks.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
            <p className="text-slate-400 mb-4">No social networks available</p>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Create first network
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {networks.map((network) => (
              <div
                key={network.id}
                className="bg-slate-800/50 border border-slate-700 hover:border-slate-600 rounded-lg p-4 transition"
              >
                <div className="flex items-start gap-4">
                  {network.icon_url && (
                    <img
                      src={network.icon_url || "/placeholder.svg"}
                      alt={network.name}
                      className="w-12 h-12 rounded-lg object-cover border border-slate-600 flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white mb-1">{network.name}</h3>
                    <div className="space-y-1 mb-3">
                      <p className="text-xs text-slate-400">Slug: <span className="text-slate-300">{network.slug}</span></p>
                      <p className="text-xs text-slate-400">Verification: <span className="text-slate-300">{network.verification_method || 'automatic'}</span></p>
                      {network.color && (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded border border-slate-600"
                            style={{ backgroundColor: network.color }}
                          />
                          <span className="text-xs text-slate-400">{network.color}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEdit(network)}
                        className="bg-teal-600/20 hover:bg-teal-600/30 text-teal-400 gap-2 px-2"
                        size="sm"
                      >
                        <Edit2 size={14} />
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDelete(network.id)}
                        className="bg-red-600/20 hover:bg-red-600/30 text-red-400 gap-2 px-2"
                        size="sm"
                        disabled={loading}
                      >
                        <Trash2 size={14} />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
