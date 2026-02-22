'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Navigation } from '@/components/Navigation'
import { Plus, Edit2, Trash2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Category {
  id: string
  name: string
  description?: string
  icon_url?: string
  status: 'active' | 'inactive'
  created_at: string
}

export default function MissionCategoriesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth/login')
      } else if (user.email !== 'remgoficial@gmail.com' && !user.is_admin) {
        router.push('/')
      } else {
        setIsAdmin(true)
      }
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (isAdmin) {
      fetchCategories()
    }
  }, [isAdmin])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/mission-categories')
      if (!res.ok) throw new Error('Failed to fetch categories')
      const data = await res.json()
      setCategories(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError('Category name is required')
      return
    }

    try {
      setError('')
      const url = editingId 
        ? `/api/admin/mission-categories/${editingId}`
        : '/api/admin/mission-categories'
      
      const method = editingId ? 'PATCH' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save category')
      }

      await fetchCategories()
      setFormData({ name: '', description: '' })
      setShowForm(false)
      setEditingId(null)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingId(category.id)
    setFormData({
      name: category.name,
      description: category.description || '',
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    try {
      const res = await fetch(`/api/admin/mission-categories/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete category')
      
      await fetchCategories()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({ name: '', description: '' })
    setError('')
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Mission Categories</h1>
            <p className="text-sm text-muted-foreground">Organize your missions into categories</p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2 rounded-lg transition"
            >
              <Plus size={16} />
              New Category
            </button>
          )}
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="px-4 max-w-2xl mb-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              {editingId ? 'Edit Category' : 'Create New Category'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Social Media"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Describe this category..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={3}
                  className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none transition resize-none"
                />
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 bg-muted hover:bg-muted/80 text-foreground font-semibold px-4 py-2 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2 rounded-lg transition"
                >
                  {editingId ? 'Update' : 'Create'} Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="px-4 max-w-2xl">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No categories created yet</p>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2 rounded-lg transition"
              >
                <Plus size={16} />
                Create First Category
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {categories.map((category) => (
              <div
                key={category.id}
                className="bg-card rounded-lg border border-border p-4 flex items-center justify-between"
              >
                <div>
                  <h3 className="font-semibold text-foreground">{category.name}</h3>
                  {category.description && (
                    <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="p-2 hover:bg-muted rounded-lg transition"
                    title="Edit"
                  >
                    <Edit2 size={16} className="text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="p-2 hover:bg-destructive/10 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 size={16} className="text-destructive" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
