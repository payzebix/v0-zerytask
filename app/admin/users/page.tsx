'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Navigation } from '@/components/Navigation'
import { ArrowLeft, Search } from 'lucide-react'
import useSWR from 'swr'
import { useSearchParams } from 'next/navigation'
import Loading from './loading'

interface User {
  id: string
  user_id: string
  username: string
  email: string
  xp_balance: number
  zeryt_balance: number
  current_level: number
  rank: number | null
  wallet_address: string | null
  twitter_handle: string | null
  created_at: string
}

interface UserProfile {
  is_admin: boolean
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function AdminUsersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  // Fetch user profile to check admin status
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

  const { data: usersData } = useSWR<any>(
    isAdmin && user ? '/api/admin/users' : null,
    fetcher
  )

  const users = Array.isArray(usersData) ? usersData : []

  const filteredUsers = users.filter(u =>
    (u.username?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (u.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  )

  if (authLoading || !isAdmin) {
    return <Loading />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 pb-24 md:pb-0">
      <Navigation isAdmin={isAdmin} />

      {/* Header */}
      <div className="sticky top-0 bg-slate-950/80 backdrop-blur-sm border-b border-slate-800 px-4 py-4 flex items-center justify-between z-10">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-slate-800 rounded-lg transition"
        >
          <ArrowLeft size={20} className="text-gray-400" />
        </button>
        <h1 className="text-lg font-bold text-white flex-1 text-center">Users</h1>
        <div className="w-8"></div>
      </div>

      {/* Search */}
      <div className="px-4 py-4 border-b border-slate-800">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 pl-9 text-white placeholder-gray-500 focus:outline-none focus:border-teal-500/50 text-sm"
          />
        </div>
      </div>

      {/* Users List */}
      <div className="px-4 py-6">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No users found</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-5 gap-2 text-xs font-bold text-gray-400 uppercase px-4 py-2 border-b border-slate-800">
              <div>User</div>
              <div>Level</div>
              <div className="text-right">XP</div>
              <div className="text-right">ZeryT</div>
              <div className="text-right">Rank</div>
            </div>
            {filteredUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => router.push(`/admin/users/${u.id}`)}
                className="w-full text-left bg-slate-800/50 border border-slate-700 hover:border-teal-500/50 hover:bg-slate-800 rounded-lg p-4 grid grid-cols-5 gap-2 items-center transition"
              >
                <div>
                  <p className="font-semibold text-white text-sm">{u.username}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </div>
                <div className="text-white font-semibold">Lvl {u.current_level}</div>
                <div className="text-right text-white font-semibold text-sm">
                  {(u.xp_balance / 1000).toFixed(1)}k
                </div>
                <div className="text-right text-white font-semibold text-sm">
                  {(u.zeryt_balance / 1000).toFixed(1)}k
                </div>
                <div className="text-right text-white font-semibold text-sm">
                  {u.rank ? `#${u.rank}` : '—'}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
