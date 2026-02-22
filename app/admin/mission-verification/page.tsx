'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Navigation } from '@/components/Navigation'
import { Check, X, Clock, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import useSWR from 'swr'

interface MissionVerification {
  id: string
  user_id: string
  mission_id: string
  mission_submission_id: string
  status: 'pending' | 'approved' | 'rejected'
  verification_type: string
  submitted_link?: string
  submitted_text?: string
  submitted_image_url?: string
  admin_notes?: string
  created_at: string
  reviewed_at?: string
  reviewed_by?: string
  mission?: {
    id: string
    title: string
    xp_reward: number
    zeryt_reward: number
  }
  user?: {
    id: string
    username: string
    email?: string
    avatar_url?: string
  }
}

interface UserProfile {
  is_admin: boolean
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function MissionVerificationPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [selectedVerification, setSelectedVerification] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifyingId, setVerifyingId] = useState<string | null>(null)

  console.log('[v0] MissionVerificationPage loaded, user:', user?.id, 'authLoading:', authLoading)

  useEffect(() => {
    console.log('[v0] Auth effect, user:', user?.id, 'authLoading:', authLoading)
    if (!authLoading && !user) {
      console.log('[v0] No user, redirecting to login')
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  const { data: userProfile } = useSWR<UserProfile>(
    user ? '/api/users/me' : null,
    fetcher
  )

  useEffect(() => {
    console.log('[v0] UserProfile effect, userProfile:', userProfile)
    if (userProfile) {
      if (userProfile.is_admin !== true) {
        console.log('[v0] User is not admin, redirecting')
        router.push('/')
      } else {
        console.log('[v0] User is admin, setting isAdmin to true')
        setIsAdmin(true)
      }
    }
  }, [userProfile, router])

  const { data: verificationsData, mutate, error: verificationError } = useSWR<{ verifications: MissionVerification[] }>(
    isAdmin ? '/api/admin/mission-verifications' : null,
    fetcher,
    { onError: (error) => console.error('[v0] Error fetching verifications:', error) }
  )

  console.log('[v0] Verifications data:', verificationsData, 'error:', verificationError)

  // Ensure verifications is always an array
  const verifications = verificationsData?.verifications || []
  const pendingVerifications = verifications.filter((v) => v.status === 'pending')
  
  console.log('[v0] Pending verifications count:', pendingVerifications.length)

  const handleVerify = async (verificationId: string, approved: boolean) => {
    setVerifyingId(verificationId)
    try {
      const res = await fetch(
        '/api/admin/mission-verifications',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            verification_id: verificationId,
            approved,
            notes: adminNotes,
          }),
        }
      )

      if (res.ok) {
        console.log('[v0] Verification submitted successfully')
        await mutate()
        setSelectedVerification(null)
        setAdminNotes('')
      } else {
        const error = await res.json()
        console.error('[v0] Error verifying:', error)
        alert(error.error || 'Failed to process verification')
      }
    } catch (error) {
      console.error('[v0] Error verifying:', error)
      alert('Failed to process verification')
    } finally {
      setVerifyingId(null)
    }
  }

  if (authLoading || !isAdmin) {
    return null
  }

  const selectedData = verifications.find((v) => v.id === selectedVerification)

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navigation isAdmin={isAdmin} />

      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-sm border-b border-border px-4 py-4 flex items-center justify-between">
        <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-lg transition">
          <X size={20} className="text-muted-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Mission Verification</h1>
        <div className="w-8"></div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submissions List */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={20} className="text-primary" />
              <h2 className="text-lg font-bold text-foreground">
                Pending
              </h2>
              <span className="ml-auto bg-primary/20 text-primary text-sm font-bold px-2.5 py-1 rounded-lg">
                {pendingVerifications.length}
              </span>
            </div>

            {pendingVerifications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">No pending verifications</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {pendingVerifications.map((verification) => (
                  <button
                    key={verification.id}
                    onClick={() => setSelectedVerification(verification.id)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition ${
                      selectedVerification === verification.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card/50 hover:border-primary/50'
                    }`}
                  >
                    <p className="text-sm font-semibold text-foreground truncate">
                      {verification.user?.username || 'Unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {verification.mission?.title || 'Unknown Mission'}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {verification.verification_type} • {new Date(verification.created_at).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submission Details */}
        <div className="lg:col-span-2">
          {!selectedData ? (
            <div className="bg-card rounded-xl border border-border p-12 text-center">
              <div className="text-4xl mb-4">📋</div>
              <p className="text-muted-foreground text-sm">Select a submission to review</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* User Info */}
              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="text-sm font-bold text-muted-foreground mb-3 uppercase">User</h3>
                <div className="flex items-center gap-3">
                  {selectedData.user?.avatar_url && (
                    <img
                      src={selectedData.user.avatar_url || "/placeholder.svg"}
                      alt={selectedData.user.username}
                      className="w-12 h-12 rounded-full bg-muted"
                    />
                  )}
                  <div>
                    <p className="text-foreground font-semibold">{selectedData.user?.username}</p>
                    <p className="text-xs text-muted-foreground">{selectedData.user_id}</p>
                  </div>
                </div>
              </div>

              {/* Mission Info */}
              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="text-sm font-bold text-muted-foreground mb-3 uppercase">Mission</h3>
                <p className="text-foreground font-semibold mb-2">{selectedData.mission?.title}</p>
                <div className="flex gap-3">
                  <div className="bg-primary/20 rounded-lg px-3 py-1.5">
                    <span className="text-sm font-bold text-primary">
                      ⚡ +{selectedData.mission?.xp_reward} XP
                    </span>
                  </div>
                  <div className="bg-accent/20 rounded-lg px-3 py-1.5">
                    <span className="text-sm font-bold text-accent">
                      💎 +{selectedData.mission?.zeryt_reward} ZeryT
                    </span>
                  </div>
                </div>
              </div>

              {/* Verification Data Display */}
              {(selectedData.submitted_link || selectedData.submitted_text || selectedData.submitted_image_url) && (
                <div className="bg-card rounded-xl border border-border p-4">
                  <h3 className="text-sm font-bold text-muted-foreground mb-3 uppercase">
                    Submitted Proof ({selectedData.verification_type})
                  </h3>
                  
                  {selectedData.submitted_image_url && (
                    <div className="space-y-3 mb-4">
                      <p className="text-sm text-muted-foreground">📸 Image Submission:</p>
                      <img
                        src={selectedData.submitted_image_url}
                        alt="Submitted proof"
                        className="w-full h-64 rounded-lg object-cover bg-muted"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg'
                        }}
                      />
                    </div>
                  )}
                  
                  {selectedData.submitted_link && (
                    <div className="space-y-3 mb-4">
                      <p className="text-sm text-muted-foreground">🔗 Link Submission:</p>
                      <div className="bg-muted/50 rounded-lg p-4 border border-border">
                        <p className="text-foreground text-sm break-all font-mono mb-2">{selectedData.submitted_link}</p>
                      </div>
                      <a
                        href={selectedData.submitted_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 text-sm inline-block underline font-semibold"
                      >
                        Open Link →
                      </a>
                    </div>
                  )}
                  
                  {selectedData.submitted_text && (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">✍️ Text Submission:</p>
                      <div className="bg-muted/50 rounded-lg p-4 border border-border">
                        <p className="text-foreground text-sm whitespace-pre-wrap">{selectedData.submitted_text}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Verification Metadata */}
              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="text-sm font-bold text-muted-foreground mb-3 uppercase">
                  Verification Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="text-foreground font-medium capitalize">{selectedData.verification_type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="text-foreground font-medium capitalize px-2 py-1 rounded bg-yellow-500/20 text-yellow-600">
                      {selectedData.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Submitted:</span>
                    <span className="text-foreground font-medium">
                      {new Date(selectedData.created_at).toLocaleString()}
                    </span>
                  </div>
                  {selectedData.reviewed_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Reviewed:</span>
                      <span className="text-foreground font-medium">
                        {new Date(selectedData.reviewed_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Notes */}
              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="text-sm font-bold text-muted-foreground mb-3 uppercase">
                  Admin Notes
                </h3>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about your decision..."
                  rows={3}
                  className="w-full bg-muted rounded-lg px-3 py-2 text-foreground text-sm placeholder-muted-foreground border border-border focus:outline-none focus:border-primary transition resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleVerify(selectedData.id, false)}
                  disabled={isVerifying || verifyingId === selectedData.id}
                  className="flex-1 bg-destructive/20 hover:bg-destructive/30 disabled:opacity-50 disabled:cursor-not-allowed text-destructive font-semibold px-4 py-3 rounded-lg transition flex items-center justify-center gap-2"
                >
                  {verifyingId === selectedData.id && !isVerifying ? (
                    <Clock size={18} className="animate-spin" />
                  ) : (
                    <X size={18} />
                  )}
                  {verifyingId === selectedData.id ? 'Processing...' : 'Reject'}
                </button>
                <button
                  onClick={() => handleVerify(selectedData.id, true)}
                  disabled={isVerifying || verifyingId === selectedData.id}
                  className="flex-1 bg-primary/20 hover:bg-primary/30 disabled:opacity-50 disabled:cursor-not-allowed text-primary font-semibold px-4 py-3 rounded-lg transition flex items-center justify-center gap-2"
                >
                  {verifyingId === selectedData.id ? (
                    <Clock size={18} className="animate-spin" />
                  ) : (
                    <Check size={18} />
                  )}
                  {verifyingId === selectedData.id ? 'Processing...' : 'Approve'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
