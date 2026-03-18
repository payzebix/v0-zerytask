'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Navigation } from '@/components/Navigation'
import { Bell, Plus, TrendingUp } from 'lucide-react'
import useSWR from 'swr'

interface DashboardStats {
  totalUsers: number
  userGrowth: number
  activeMissions: number
  pendingExchanges: number
  zerytDistributed: number
  zerytInUSD: number
  newReferrals: number
  totalReferrals: number
}

interface RecentActivity {
  id: string
  type: 'referral' | 'exchange' | 'mission' | 'mission_completed'
  title: string
  description: string
  timestamp: string
  username: string
}

interface UserProfile {
  is_admin: boolean
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function AdminDashboard() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)

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

  const { data: stats } = useSWR<DashboardStats>(
    isAdmin ? '/api/admin/stats' : null,
    fetcher
  )

  const { data: activityData } = useSWR<any>(
    isAdmin ? '/api/admin/activity' : null,
    fetcher
  )

  const activity = Array.isArray(activityData) ? activityData : []

  if (authLoading || !isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 pb-24">
      <Navigation isAdmin={isAdmin} />

      {/* Header */}
      <div className="px-4 pt-6 flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-teal-500/20 border border-teal-500 flex items-center justify-center text-xs font-bold text-teal-400">
              👤
            </div>
            <div>
              <p className="text-xs text-gray-400">Dashboard</p>
              <p className="text-lg font-bold text-white">Welcome back, Admin</p>
            </div>
          </div>
        </div>
        <button className="p-2 hover:bg-slate-800 rounded-lg transition relative">
          <Bell size={20} className="text-gray-400" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
      </div>

      {/* Date Filter */}
      <div className="px-4 mb-6 flex gap-2">
        <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-white text-sm rounded-lg border border-slate-700 transition flex items-center gap-2">
          📅 THIS WEEK
        </button>
      </div>

      {/* Stats Grid */}
      <div className="px-4 grid grid-cols-2 gap-4 mb-6">
        <Link href="/admin/users" className="bg-slate-800/50 border border-slate-700 hover:border-slate-600 rounded-lg p-4 transition">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">👥</span>
            <span className="text-xs text-gray-400 font-semibold">Total Users</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {stats?.totalUsers?.toLocaleString() || '0'}
          </p>
          <p className="text-xs text-teal-400 mt-1">📈 +{stats?.userGrowth}%</p>
        </Link>

        <Link href="/admin/missions" className="bg-slate-800/50 border border-slate-700 hover:border-slate-600 rounded-lg p-4 transition">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🚀</span>
            <span className="text-xs text-gray-400 font-semibold">Active Missions</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {stats?.activeMissions || '0'}
          </p>
          <p className="text-xs text-teal-400 mt-1">Live Now</p>
        </Link>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">💎</span>
            <span className="text-xs text-gray-400 font-semibold">ZeryT Dist.</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {stats?.zerytDistributed?.toLocaleString() || '0'}
          </p>
          <p className="text-xs text-gray-500 mt-1">≈ ${stats?.zerytInUSD?.toLocaleString() || '0'} USD</p>
        </div>

        <Link href="/admin/requests" className="bg-slate-800/50 border border-slate-700 hover:border-slate-600 rounded-lg p-4 transition">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">⏱</span>
            <span className="text-xs text-gray-400 font-semibold">Pending</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {stats?.pendingExchanges || '0'}
          </p>
          <p className="text-xs text-orange-400 mt-1">ACTION REQ.</p>
        </Link>
      </div>

      {/* Economy Health Chart */}
      <div className="px-4 mb-6 bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Economy Health</h3>
          <div className="flex gap-2 text-xs">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-400 ml-2">
              OUTFLOW
            </span>
            <span className="inline-block w-2 h-2 rounded-full bg-teal-400 ml-2">
              INFLOW
            </span>
          </div>
        </div>

        {/* Placeholder Chart */}
        <div className="h-32 bg-slate-900/50 rounded-lg flex items-center justify-center">
          <p className="text-gray-500 text-sm">Chart visualization</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mb-6">
        <h3 className="text-lg font-bold text-white mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <Link
            href="/admin/mission-profiles"
            className="bg-slate-800/50 border border-slate-700 hover:border-teal-500 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            📋 Profiles
          </Link>
          <Link
            href="/admin/mission-profiles"
            className="bg-slate-800/50 border border-slate-700 hover:border-teal-500 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            🏷 Profiles
          </Link>
          <Link
            href="/admin/missions"
            className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Mission
          </Link>
          <Link
            href="/admin/customization"
            className="bg-slate-800/50 border border-slate-700 hover:border-purple-500 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            🎨 Customize
          </Link>
          <Link
            href="/admin/social-networks"
            className="bg-slate-800/50 border border-slate-700 hover:border-teal-500 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            🔗 Networks
          </Link>
          <Link
            href="/admin/invitation-codes"
            className="bg-slate-800/50 border border-slate-700 hover:border-teal-500 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            🎫 Invites
          </Link>
          <Link
            href="/admin/mission-verification"
            className="bg-slate-800/50 border border-slate-700 hover:border-teal-500 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            ✓ Verify
          </Link>
          <Link
            href="/admin/system"
            className="bg-slate-800/50 border border-slate-700 hover:border-teal-500 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            ⚙️ System
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-white">Recent Activity</h3>
          <button className="text-teal-400 text-sm font-semibold hover:text-teal-300">
            View All
          </button>
        </div>

        <div className="space-y-2">
          {activity?.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 flex items-center gap-3"
            >
              <div className="text-lg">
                {item.type === 'referral'
                  ? '👥'
                  : item.type === 'exchange'
                    ? '💱'
                    : item.type === 'mission'
                      ? '🎯'
                      : '✓'}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="text-xs text-gray-400">{item.description}</p>
              </div>
              <p className="text-xs text-gray-500">{item.timestamp}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
