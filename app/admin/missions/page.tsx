'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Navigation } from '@/components/Navigation'
import { ArrowLeft, Plus, Search, Filter, Edit, Trash2, MoreVertical } from 'lucide-react'
import useSWR from 'swr'
import { useSearchParams } from 'next/navigation'
import Loading from './loading'

interface Mission {
  id: string
  title: string
  description: string
  category: string
  xp_reward: number
  zeryt_reward: number
  verification_method: string
  active: boolean
  created_at: string
}

interface UserProfile {
  is_admin: boolean
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function AdminMissionsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  console.log('[v0] AdminMissionsPage loaded, user:', user?.id, 'authLoading:', authLoading)

  useEffect(() => {
    console.log('[v0] AdminMissionsPage auth effect, user:', user?.id)
    if (!authLoading && !user) {
      console.log('[v0] No user, redirecting to login')
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  const { data: userProfile, error: profileError } = useSWR<UserProfile>(
    user ? '/api/users/me' : null,
    fetcher,
    { onError: (error) => console.error('[v0] Error fetching user profile:', error) }
  )

  console.log('[v0] AdminMissionsPage userProfile:', userProfile, 'error:', profileError)

  useEffect(() => {
    console.log('[v0] AdminMissionsPage userProfile effect:', userProfile)
    if (userProfile) {
      if (userProfile.is_admin !== true) {
        console.log('[v0] User is not admin, redirecting')
        router.push('/')
      } else {
        console.log('[v0] User is admin, setting isAdmin')
        setIsAdmin(true)
      }
    }
  }, [userProfile, router])

  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'paused' | 'archived'>('all')

  const { data: missionsData, mutate: mutateMissions } = useSWR<any>(
    isAdmin && user ? '/api/admin/missions' : null,
    fetcher
  )

  const missions = Array.isArray(missionsData) ? missionsData : []

  const handleToggleStatus = async (missionId: string, currentStatus: string) => {
    setIsProcessing(missionId)
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active'
      const res = await fetch(`/api/admin/missions/${missionId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        mutateMissions()
      }
    } catch (error) {
      console.error('[v0] Error toggling mission status:', error)
    } finally {
      setIsProcessing(null)
    }
  }

  const handleDeleteMission = async (missionId: string) => {
    setIsProcessing(missionId)
    try {
      const res = await fetch(`/api/admin/missions/${missionId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        mutateMissions()
        setDeleteConfirmId(null)
      }
    } catch (error) {
      console.error('[v0] Error deleting mission:', error)
    } finally {
      setIsProcessing(null)
    }
  }

  const filteredMissions = missions.filter(m => {
    const matchesSearch = m.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         m.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && m.status === 'active') ||
                         (statusFilter === 'pending' && m.status === 'pending') ||
                         (statusFilter === 'inactive' && m.status === 'inactive')
    return matchesSearch && matchesStatus
  })

  if (authLoading || !isAdmin) {
    return <Loading />
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <Navigation isAdmin={isAdmin} />

      {/* Header */}
      <div className="sticky top-0 bg-card/80 backdrop-blur-sm border-b border-border px-4 py-4 flex items-center justify-between z-10">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-muted rounded-lg transition"
        >
          <ArrowLeft size={20} className="text-muted-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground flex-1 text-center">
          Mission Control
        </h1>
        <div className="w-8"></div>
      </div>

      {/* Create Mission */}
      <div className="px-4 py-6 bg-muted/30 border-b border-border">
        <Link
          href="/admin/missions/create"
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Create Mission
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="px-4 py-4 space-y-3 border-b border-border">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search missions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 pl-9 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary text-sm"
            />
          </div>
        </div>
        
        {/* Status Filter */}
        <div className="flex gap-2 flex-wrap">
          {(['all', 'active', 'pending', 'inactive'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                statusFilter === status
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 border border-border'
              }`}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              {status !== 'all' && missions.filter(m => m.status === status).length > 0 && (
                <span className="ml-2 text-xs opacity-75">
                  ({missions.filter(m => m.status === status).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Missions List */}
      <div className="px-4 py-6">
        <h2 className="text-lg font-bold text-foreground mb-4">
          {statusFilter === 'all' ? 'All Missions' : 
           statusFilter === 'pending' ? 'Pending Approval' :
           statusFilter === 'active' ? 'Active Missions' :
           'Inactive Missions'}
        </h2>

        {filteredMissions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {missions.length === 0 ? 'No missions created yet' : 'No missions match your filters'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMissions.map((mission) => {
              const statusColors = {
                active: { bg: 'bg-primary/20', text: 'text-primary', label: 'Active' },
                pending: { bg: 'bg-accent/20', text: 'text-accent', label: 'Pending' },
                inactive: { bg: 'bg-muted/20', text: 'text-muted-foreground', label: 'Inactive' }
              }
              const statusStyle = statusColors[mission.status as keyof typeof statusColors] || statusColors.inactive
              
              return (
                <div
                  key={mission.id}
                  className="bg-card border border-border rounded-lg p-4 hover:bg-card/80 transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${statusStyle.bg} ${statusStyle.text}`}>
                          {statusStyle.label}
                        </span>
                        {mission.priority && (
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                            mission.priority === 'high' ? 'bg-destructive/20 text-destructive' :
                            mission.priority === 'normal' ? 'bg-primary/20 text-primary' :
                            'bg-muted/20 text-muted-foreground'
                          }`}>
                            {mission.priority === 'high' ? '⭐ High' : mission.priority === 'normal' ? 'Normal' : 'Low'}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-foreground mb-1">{mission.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{mission.description}</p>
                      <div className="flex gap-3 flex-wrap">
                        <span className="text-xs font-semibold text-accent">
                          ⚡ {mission.xp_reward} XP
                        </span>
                        <span className="text-xs font-semibold text-primary">
                          💎 {mission.zeryt_reward || 0} ZeryT
                        </span>
                        {mission.created_at && (
                          <span className="text-xs text-muted-foreground/70">
                            📅 {new Date(mission.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => router.push(`/admin/missions/${mission.id}/edit`)}
                        title="Edit mission"
                        disabled={isProcessing === mission.id}
                        className="p-2 hover:bg-muted rounded transition text-muted-foreground hover:text-primary disabled:opacity-50"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(mission.id, mission.status)}
                        title={mission.status === 'active' ? 'Pause mission' : 'Activate mission'}
                        disabled={isProcessing === mission.id}
                        className="p-2 hover:bg-muted rounded transition text-muted-foreground hover:text-primary disabled:opacity-50"
                      >
                        {mission.status === 'active' ? '⏸' : '▶'}
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(mission.id)}
                        title="Delete mission"
                        disabled={isProcessing === mission.id}
                        className="p-2 hover:bg-destructive/20 rounded transition text-muted-foreground hover:text-destructive disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Delete Confirmation */}
                    {deleteConfirmId === mission.id && (
                      <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center gap-2">
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-3 py-1 text-sm rounded bg-muted text-foreground hover:bg-muted/80"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDeleteMission(mission.id)}
                          disabled={isProcessing === mission.id}
                          className="px-3 py-1 text-sm rounded bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                        >
                          {isProcessing === mission.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
