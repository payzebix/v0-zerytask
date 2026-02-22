'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Navigation } from '@/components/Navigation'
import { ArrowLeft } from 'lucide-react'
import useSWR from 'swr'

interface ReferralConfig {
  xp_reward: number
  zeryt_reward: number
  usdc_reward: number
  min_level_requirement: number
  min_missions_requirement: number
  multiplier: number
}

interface UserProfile {
  is_admin: boolean
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function AdminReferralsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    xp_reward: 5000,
    zeryt_reward: 250,
    usdc_reward: 50,
    min_level_requirement: 3,
    min_missions_requirement: 5,
    multiplier: 1.0,
  })

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

  const { data: config } = useSWR<ReferralConfig>(
    isAdmin && user ? '/api/referrals/config' : null,
    fetcher,
    {
      onSuccess: (data) => setFormData(data)
    }
  )

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch('/api/admin/referrals-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
    } catch (error) {
      console.error('[v0] Error saving config:', error)
    } finally {
      setSaving(false)
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
          Referral Configuration
        </h1>
        <div className="w-8"></div>
      </div>

      {/* Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSave()
        }}
        className="px-4 py-6"
      >
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-6">
          {/* Rewards Section */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Referral Rewards</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">
                  XP Reward
                </label>
                <input
                  type="number"
                  value={formData.xp_reward}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      xp_reward: parseInt(e.target.value),
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-teal-500/50 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">
                  ZeryT Reward
                </label>
                <input
                  type="number"
                  value={formData.zeryt_reward}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      zeryt_reward: parseInt(e.target.value),
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-teal-500/50 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">
                  USDC Reward
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.usdc_reward}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      usdc_reward: parseFloat(e.target.value),
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-teal-500/50 transition"
                />
              </div>
            </div>
          </div>

          {/* Requirements Section */}
          <div className="pt-4 border-t border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4">Requirements</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">
                  Minimum Level
                </label>
                <input
                  type="number"
                  value={formData.min_level_requirement}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      min_level_requirement: parseInt(e.target.value),
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-teal-500/50 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">
                  Minimum Missions
                </label>
                <input
                  type="number"
                  value={formData.min_missions_requirement}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      min_missions_requirement: parseInt(e.target.value),
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-teal-500/50 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">
                  Multiplier
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.multiplier}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      multiplier: parseFloat(e.target.value),
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-teal-500/50 transition"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-teal-500/50 text-white font-semibold py-3 rounded-lg transition"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  )
}
