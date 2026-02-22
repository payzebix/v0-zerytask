'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Navigation } from '@/components/Navigation'
import { ArrowLeft, Settings, Copy } from 'lucide-react'
import useSWR from 'swr'

interface ExchangeRequest {
  id: string
  user_id: string
  username: string
  zeryt_amount: number
  usdc_amount: number
  wallet_address: string
  status: 'pending' | 'paid' | 'rejected'
  created_at: string
  marked_paid_at?: string
}

interface ExchangeConfig {
  zeryt_exchange_rate: number
  min_withdrawal_amount: number
}

interface UserProfile {
  is_admin: boolean
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function AdminRequestsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'paid'>('pending')
  const [exchangeRate, setExchangeRate] = useState('0.05')
  const [minWithdrawal, setMinWithdrawal] = useState('500')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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

  const { data: config } = useSWR<ExchangeConfig>(
    isAdmin && user ? '/api/exchange/config' : null,
    fetcher,
    {
      onSuccess: (data) => {
        setExchangeRate(data.zeryt_exchange_rate.toString())
        setMinWithdrawal(data.min_withdrawal_amount.toString())
      }
    }
  )

  const { data: requestsData, mutate } = useSWR<any>(
    isAdmin && user ? '/api/admin/exchange-requests' : null,
    fetcher
  )

  const allRequests = Array.isArray(requestsData) ? requestsData : []

  const requests = allRequests.filter(r =>
    activeTab === 'all' ? true : r.status === activeTab
  )

  const handleSaveConfig = async () => {
    setSaving(true)
    setError('')

    try {
      const response = await fetch('/api/admin/exchange-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zeryt_exchange_rate: parseFloat(exchangeRate),
          min_withdrawal_amount: parseInt(minWithdrawal),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save configuration')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleMarkAsPaid = async (requestId: string) => {
    try {
      const response = await fetch(`/api/admin/exchange-requests/${requestId}/pay`, {
        method: 'POST',
      })

      if (response.ok) {
        mutate()
      }
    } catch (error) {
      console.error('[v0] Error marking as paid:', error)
    }
  }

  if (authLoading || !isAdmin) {
    return null
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
          Admin Controls
        </h1>
        <button className="p-2 hover:bg-slate-800 rounded-lg transition">
          <Settings size={20} className="text-gray-400" />
        </button>
      </div>

      {/* Exchange Configuration */}
      <div className="px-4 py-6">
        <h2 className="text-lg font-bold text-white mb-4">Exchange Configuration</h2>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">
                ZeryT Rate ($)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  💱
                </span>
                <input
                  type="number"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                  step="0.01"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 pl-10 text-white focus:outline-none focus:border-teal-500/50 transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">
                Min. Withdrawal ($)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  💵
                </span>
                <input
                  type="number"
                  value={minWithdrawal}
                  onChange={(e) => setMinWithdrawal(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 pl-10 text-white focus:outline-none focus:border-teal-500/50 transition"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <button
            onClick={handleSaveConfig}
            disabled={saving}
            className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-teal-500/50 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            🔐 {saving ? 'Saving...' : 'Update Global Settings'}
          </button>
        </div>
      </div>

      {/* Requests Tabs */}
      <div className="px-4 py-4 flex gap-2 border-b border-slate-800 overflow-x-auto">
        {(['all', 'pending', 'paid'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${
              activeTab === tab
                ? 'bg-teal-500 text-white'
                : 'bg-slate-800 text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'all'
              ? 'All Requests'
              : tab === 'pending'
                ? `Pending (${allRequests.filter(r => r.status === 'pending').length})`
                : 'Paid'}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="px-4 py-6">
        <h3 className="text-lg font-bold text-white mb-4">
          {activeTab === 'pending' ? 'Pending Requests' : 'All Requests'}
        </h3>

        {requests.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No requests in this category</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => (
              <div
                key={request.id}
                className={`bg-slate-800/50 border rounded-lg p-4 ${
                  request.status === 'paid'
                    ? 'border-teal-500/30'
                    : request.status === 'pending'
                      ? 'border-orange-500/30'
                      : 'border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white">
                      {request.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        @{request.username}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-white">
                      ${request.usdc_amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">USDC</p>
                  </div>
                </div>

                <div className="mb-3 p-3 bg-slate-900/50 rounded">
                  <div className="text-xs text-gray-400 mb-1">WALLET ADDRESS</div>
                  <div className="flex items-center gap-2">
                    <code className="text-sm text-white font-mono">
                      {request.wallet_address.slice(0, 6)}...
                      {request.wallet_address.slice(-4)}
                    </code>
                    <button className="p-1 hover:bg-slate-800 rounded transition">
                      <Copy size={14} className="text-gray-400" />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-gray-400 mb-4">
                  EXCHANGE: {request.zeryt_amount.toLocaleString()} ZeryT
                </div>

                {request.status === 'pending' && (
                  <button
                    onClick={() => handleMarkAsPaid(request.id)}
                    className="w-full bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/50 text-teal-400 font-semibold py-2 rounded-lg transition"
                  >
                    Mark as Paid
                  </button>
                )}

                {request.status === 'paid' && (
                  <div className="w-full bg-teal-500/20 border border-teal-500/50 text-teal-400 font-semibold py-2 rounded-lg flex items-center justify-center gap-2">
                    ✓ Paid
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
