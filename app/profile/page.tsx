'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Navigation } from '@/components/Navigation'
import { ArrowLeft, Edit, LogOut, Copy, Plus, X, Check } from 'lucide-react'
import useSWR from 'swr'
import { getProgressInfo, LEVEL_SYSTEM } from '@/lib/level-system'

interface UserProfile {
  id: string
  username: string
  email: string
  xp_balance: number
  zeryt_balance: number
  current_level: number
  wallet_address: string | null
  twitter_handle: string | null
  avatar_url: string | null
  referral_code: string
  created_at: string
  is_admin?: boolean
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [updating, setUpdating] = useState(false)
  const [xpForNextReward, setXpForNextReward] = useState<number>(0)
  const [xpToNextLevel, setXpToNextLevel] = useState<number>(0)
  const [xpProgress, setXpProgress] = useState<number>(0)
  const [progressInfo, setProgressInfo] = useState<any>(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [updatingPassword, setUpdatingPassword] = useState(false)
  const [showReferralModal, setShowReferralModal] = useState(false)
  const [referralError, setReferralError] = useState('')
  const [referralSuccess, setReferralSuccess] = useState('')
  const [generatedCodes, setGeneratedCodes] = useState<any[]>([])
  const [generatingReferrals, setGeneratingReferrals] = useState(false)
  const [referralQuantity, setReferralQuantity] = useState<number>(1)

  const { data: userProfile, mutate } = useSWR<UserProfile>(
    user ? '/api/users/me' : null,
    fetcher
  )

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (userProfile) {
      setIsAdmin(userProfile.is_admin === true)
      const progressInfo = getProgressInfo(userProfile.xp_balance)
      setXpForNextReward(progressInfo.xpForNextReward)
      setXpToNextLevel(progressInfo.xpToNextLevel)
      setXpProgress(progressInfo.xpProgress)
      setProgressInfo(progressInfo)
    }
  }, [userProfile])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/auth/login')
  }

  const handleEditStart = (field: string, value: string) => {
    setEditingField(field)
    setEditValue(value || '')
  }

  const handleEditSave = async (field: string) => {
    setUpdating(true)
    try {
      const response = await fetch('/api/users/me/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: editValue }),
      })

      if (response.ok) {
        mutate()
        setEditingField(null)
      }
    } catch (error) {
      console.error('[v0] Update error:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleCopyReferralCode = () => {
    if (userProfile?.referral_code) {
      navigator.clipboard.writeText(userProfile.referral_code)
    }
  }

  const handleChangePassword = async () => {
    setPasswordError('')
    setPasswordSuccess('')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }

    setUpdatingPassword(true)
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to change password')
      }

      setPasswordSuccess('Password changed successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setShowPasswordModal(false), 1500)
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setUpdatingPassword(false)
    }
  }

  const identityFields = [
    { label: 'Username', key: 'username', icon: '👤' },
    { label: 'Main Wallet', key: 'wallet_address', icon: '🏦' },
    { label: 'Email Address', key: 'email', icon: '✉️', editable: false },
    { label: 'X / Twitter', key: 'twitter_handle', icon: '𝕏' },
  ]

  return (
    <div className="min-h-screen bg-background pb-32">
      <Navigation isAdmin={isAdmin} />

      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-sm border-b border-border px-4 py-4 flex items-center justify-between">
        <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-lg transition">
          <ArrowLeft size={20} className="text-muted-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Account</h1>
        <div className="w-8"></div>
      </div>

      {/* Profile Section */}
      {!userProfile ? (
        <div className="px-4 py-8 text-center">
          <div className="text-muted-foreground">Loading profile...</div>
        </div>
      ) : (
        <div className="px-4 py-6 space-y-6">
          {/* Avatar Card */}
          <div className="bg-card rounded-2xl border border-border p-6 text-center">
            <div className="mb-4 flex justify-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center border-2 border-primary">
                  <span className="text-3xl font-bold text-primary-foreground">
                    {userProfile.username?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-foreground">{userProfile.username}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Level {userProfile.current_level} • Member since {new Date(userProfile.created_at).toLocaleDateString()}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card rounded-xl border border-border p-4 hover:border-primary/50 transition-colors">
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase">ZeryT Balance</p>
              <p className="text-2xl font-bold text-primary">
                {typeof userProfile.zeryt_balance === 'number' 
                  ? userProfile.zeryt_balance.toFixed(2).replace(/\.00$/, '')
                  : '0'}
              </p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 hover:border-accent/50 transition-colors">
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase">XP Balance</p>
              <p className="text-2xl font-bold text-accent">
                {typeof userProfile.xp_balance === 'number' ? userProfile.xp_balance.toLocaleString() : '0'}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          {progressInfo && (
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  Progress to Level {userProfile.current_level + 1}
                </span>
                <span className="text-xs font-bold text-primary">
                  {typeof xpProgress === 'number' && !isNaN(xpProgress) ? `${Math.round(xpProgress)}%` : '0%'}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-primary to-accent h-full rounded-full transition-all duration-300"
                  style={{ width: `${typeof xpProgress === 'number' && !isNaN(xpProgress) ? Math.min(xpProgress, 100) : 0}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                <span>
                  {typeof progressInfo?.xpInCurrentLevel === 'number' 
                    ? progressInfo.xpInCurrentLevel.toLocaleString() 
                    : '0'} / {typeof progressInfo?.xpForNextLevel === 'number' 
                    ? progressInfo.xpForNextLevel.toLocaleString() 
                    : '0'} XP
                </span>
                <span>
                  {typeof xpToNextLevel === 'number' && !isNaN(xpToNextLevel) 
                    ? xpToNextLevel.toLocaleString() 
                    : '0'} needed
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Identity Links */}
      {userProfile && (
        <div className="px-4 py-6">
          <h3 className="text-lg font-bold text-foreground mb-4">Account Settings</h3>
          <div className="space-y-3">
            {identityFields.map((field) => {
              const value = userProfile[field.key as keyof UserProfile]
              const isEditing = editingField === field.key
              const editable = field.editable !== false

              return (
                <div key={field.key} className="bg-card rounded-lg border border-border p-4 hover:border-primary/50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-lg flex-shrink-0">{field.icon}</span>
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-semibold uppercase">{field.label}</p>
                      {isEditing && editable ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="text-sm text-foreground bg-muted border border-primary/50 rounded px-2 py-1 mt-1 w-full focus:outline-none focus:border-primary"
                          autoFocus
                        />
                      ) : (
                        <p className="text-sm text-foreground mt-1 truncate">{value || '-'}</p>
                      )}
                    </div>
                  </div>
                  {editable && (
                    <div className="flex gap-1 ml-2 flex-shrink-0">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleEditSave(field.key)}
                            disabled={updating}
                            className="p-2 hover:bg-muted rounded transition text-primary disabled:opacity-50"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => setEditingField(null)}
                            className="p-2 hover:bg-muted rounded transition text-muted-foreground"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleEditStart(field.key, String(value || ''))}
                          className="p-2 hover:bg-muted rounded transition text-muted-foreground hover:text-primary"
                        >
                          <Edit size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Change Password */}
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full bg-card rounded-lg border border-border p-4 hover:border-primary/50 transition-colors flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">🔐</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Change Password</p>
                  <p className="text-xs text-muted-foreground">Update your account security</p>
                </div>
              </div>
              <Edit size={16} className="text-muted-foreground flex-shrink-0" />
            </button>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && userProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Change Password</h2>
              <button onClick={() => setShowPasswordModal(false)} className="p-1 hover:bg-muted rounded transition">
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your new password"
                  className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition"
                />
              </div>
            </div>

            {passwordError && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mb-4">
                <p className="text-sm text-destructive">{passwordError}</p>
              </div>
            )}

            {passwordSuccess && (
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 mb-4">
                <p className="text-sm text-primary">{passwordSuccess}</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 bg-muted hover:bg-muted/80 text-foreground font-semibold py-2 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={updatingPassword}
                className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground font-semibold py-2 rounded-lg transition"
              >
                {updatingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout */}
      <div className="px-4 py-6 border-t border-border mt-8">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-destructive/10 hover:bg-destructive/20 text-destructive font-semibold py-3 px-4 rounded-lg border border-destructive/30 transition"
        >
          <LogOut size={18} />
          Log Out
        </button>
      </div>
    </div>
  )
}
