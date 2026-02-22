'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Navigation } from '@/components/Navigation'
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react'
import useSWR from 'swr'

interface MissionProfile {
  id: string
  name: string
  description: string
  logo_url: string
  status: 'active' | 'inactive' | 'archived'
  created_by: string
  created_at: string
  updated_at: string
}

interface UserProfile {
  is_admin: boolean
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function MissionProfilesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  const { data: userProfile } = useSWR<UserProfile>(
    user ? '/api/users/me' : null,
    fetcher
  )

  useEffect(() => {
    if (userProfile) {
      if (userProfile.is_admin !== true) {
        router.push('/')
      } else {
        setIsAdmin(true)
      }
    }
  }, [userProfile, router])

  const { data: profiles, mutate } = useSWR<MissionProfile[]>(
    isAdmin ? '/api/admin/mission-profiles' : null,
    fetcher
  )

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/mission-profiles/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        mutate()
        setDeleteId(null)
      }
    } catch (error) {
      console.error('Error deleting profile:', error)
    }
  }

  if (authLoading || !isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 pb-24">
      <Navigation isAdmin={isAdmin} />

      {/* Header */}
      <div className="px-4 pt-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">ADMIN PANEL</p>
            <h1 className="text-2xl font-bold text-white">Mission Profiles</h1>
            <p className="text-sm text-gray-400 mt-1">Create and manage mission brand profiles</p>
          </div>
          <Link
            href="/admin/mission-profiles/create"
            className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white font-semibold px-4 py-2 rounded-lg transition"
          >
            <Plus size={18} />
            New Profile
          </Link>
        </div>
      </div>

      {/* Profiles Grid */}
      <div className="px-4">
        {!profiles || profiles.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-gray-400 text-sm mb-4">No mission profiles yet. Create one to get started!</p>
            <Link
              href="/admin/mission-profiles/create"
              className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white font-semibold px-4 py-2 rounded-lg transition"
            >
              <Plus size={18} />
              Create First Profile
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition"
              >
                {/* Logo */}
                {profile.logo_url && (
                  <img
                    src={profile.logo_url || "/placeholder.svg"}
                    alt={profile.name}
                    className="w-full h-32 rounded-lg mb-3 object-cover bg-slate-900"
                  />
                )}

                {/* Profile Info */}
                <h3 className="text-lg font-bold text-white mb-1">{profile.name}</h3>
                <p className="text-sm text-gray-400 mb-3 line-clamp-2">{profile.description}</p>

                {/* Status Badge */}
                <div className="mb-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                    profile.status === 'active'
                      ? 'bg-teal-500/20 text-teal-400'
                      : profile.status === 'inactive'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {profile.status === 'active' ? <Check size={12} /> : <X size={12} />}
                    {profile.status.toUpperCase()}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mb-2">
                  <Link
                    href={`/admin/mission-profiles/${profile.id}`}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold px-3 py-2 rounded transition flex items-center justify-center gap-2"
                  >
                    <Edit2 size={14} />
                    Edit
                  </Link>
                  <Link
                    href={`/admin/missions/new?profile=${profile.id}`}
                    className="flex-1 bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 text-sm font-semibold px-3 py-2 rounded transition flex items-center justify-center gap-2"
                  >
                    <Plus size={14} />
                    Add Mission
                  </Link>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => setDeleteId(deleteId === profile.id ? null : profile.id)}
                  className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-semibold px-3 py-2 rounded transition flex items-center justify-center gap-2"
                >
                  <Trash2 size={14} />
                  Delete
                </button>

                {/* Delete Confirmation */}
                {deleteId === profile.id && (
                  <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded">
                    <p className="text-sm text-red-400 mb-2 font-semibold">Delete profile?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(profile.id)}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold py-1 rounded transition"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setDeleteId(null)}
                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold py-1 rounded transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
