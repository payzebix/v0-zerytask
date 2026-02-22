'use client'

import React from "react"

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Navigation } from '@/components/Navigation'
import { ArrowLeft, Save } from 'lucide-react'
import useSWR from 'swr'

interface User {
  id: string
  email: string
  username: string
  xp_balance: number
  zeryt_balance: number
  current_level: number
  wallet_address: string | null
  twitter_handle: string | null
  is_suspended: boolean
  is_banned: boolean
  suspension_reason: string | null
  created_at: string
}

interface UserProfile {
  is_admin: boolean
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function AdminUserEditPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params?.id as string
  const { user: authUser, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [formData, setFormData] = useState<Partial<User>>({})

  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/auth/login')
    }
  }, [authUser, authLoading, router])

  const { data: userProfile } = useSWR<UserProfile>(
    authUser ? '/api/users/me' : null,
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

  const { data: user } = useSWR<User>(
    isAdmin && userId ? `/api/admin/users/${userId}` : null,
    fetcher,
    {
      onSuccess: (data) => {
        setFormData(data)
      },
    }
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setLoading(true)

    try {
      const response = await fetch(`/api/admin/users/${userId}/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update user')
      }

      setSuccessMessage('User updated successfully')
      setTimeout(() => {
        router.push('/admin/users')
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || !isAdmin) {
    return null
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 pb-24 md:pb-0">
        <Navigation isAdmin={isAdmin} />
        <div className="flex items-center justify-center h-screen">
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
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
        <h1 className="text-lg font-bold text-white flex-1 text-center">
          Edit User
        </h1>
        <div className="w-8"></div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-4 py-6 max-w-2xl mx-auto">
        {/* User Info */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-white mb-4">User Information</h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">
                Username
              </label>
              <input
                type="text"
                value={formData.username || ''}
                disabled
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-gray-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email || ''}
                disabled
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Balances */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">
                XP Balance
              </label>
              <input
                type="number"
                value={formData.xp_balance || 0}
                onChange={(e) =>
                  setFormData({ ...formData, xp_balance: parseInt(e.target.value) || 0 })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-teal-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">
                ZeryT Balance
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.zeryt_balance || 0}
                onChange={(e) =>
                  setFormData({ ...formData, zeryt_balance: parseFloat(e.target.value) || 0 })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-teal-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">
              Level
            </label>
            <input
              type="number"
              min="1"
              value={formData.current_level || 1}
              onChange={(e) =>
                setFormData({ ...formData, current_level: parseInt(e.target.value) || 1 })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-teal-500/50"
            />
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-white mb-4">Social & Wallet</h2>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">
              Wallet Address
            </label>
            <input
              type="text"
              value={formData.wallet_address || ''}
              onChange={(e) =>
                setFormData({ ...formData, wallet_address: e.target.value })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-teal-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">
              Twitter Handle
            </label>
            <input
              type="text"
              value={formData.twitter_handle || ''}
              onChange={(e) =>
                setFormData({ ...formData, twitter_handle: e.target.value })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-teal-500/50"
            />
          </div>
        </div>

        {/* Account Status */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-white mb-4">Account Status</h2>

          <div className="space-y-4 mb-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_suspended || false}
                onChange={(e) =>
                  setFormData({ ...formData, is_suspended: e.target.checked })
                }
                className="w-4 h-4"
              />
              <span className="text-white">Suspend Account</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_banned || false}
                onChange={(e) =>
                  setFormData({ ...formData, is_banned: e.target.checked })
                }
                className="w-4 h-4"
              />
              <span className="text-white">Ban Account</span>
            </label>
          </div>

          {(formData.is_suspended || formData.is_banned) && (
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">
                Reason
              </label>
              <textarea
                value={formData.suspension_reason || ''}
                onChange={(e) =>
                  setFormData({ ...formData, suspension_reason: e.target.value })
                }
                placeholder="Enter reason for suspension/ban..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-teal-500/50 resize-none h-24"
              />
            </div>
          )}
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-6">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-6">
            <p className="text-sm text-green-400">{successMessage}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-teal-500/50 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
        >
          <Save size={18} />
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
