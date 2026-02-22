'use client'

import React from 'react'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Navigation } from '@/components/Navigation'
import { ArrowLeft, Mail, MessageCircle, Globe, Twitter, CheckCircle, Copy, Check, Clock } from 'lucide-react'
import useSWR from 'swr'

interface SubMission {
  id: string
  title: string
  description: string
  xp_reward: number
  zeryt_reward: number
  verification_type: string
  logo_url?: string
}

interface MissionProfile {
  name: string
  logo_url?: string
  description: string
}

interface Mission {
  id: string
  title: string
  brief?: string
  description: string
  category: string
  xp_reward?: number
  zeryt_reward?: number
  image_url?: string
  status?: string
  verification_method?: string
  verification_type?: string
  schedule_type?: string
  schedule_start_date?: string
  schedule_end_date?: string
  schedule_start_time?: string
  schedule_end_time?: string
  created_at?: string
  mission_profile_id?: string
  sub_missions?: SubMission[]
  social_network_id?: string | number
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const getPlatformIcon = (verification_type: string, socialNetworkId?: string | number) => {
  // Check social network ID first if provided
  if (socialNetworkId) {
    const networkStr = String(socialNetworkId).toLowerCase()
    if (networkStr.includes('twitter') || networkStr.includes('x')) {
      return <Twitter size={24} className="text-blue-400" />
    }
    if (networkStr.includes('telegram')) {
      return <MessageCircle size={24} className="text-blue-400" />
    }
    if (networkStr.includes('discord')) {
      return <MessageCircle size={24} className="text-indigo-400" />
    }
  }
  
  // Fall back to verification type
  switch (verification_type.toLowerCase()) {
    case 'social':
    case 'twitter':
    case 'x':
      return <Twitter size={24} className="text-blue-400" />
    case 'telegram':
      return <MessageCircle size={24} className="text-blue-400" />
    case 'discord':
      return <MessageCircle size={24} className="text-indigo-400" />
    case 'web':
    case 'on-chain':
      return <Globe size={24} className="text-emerald-400" />
    default:
      return <Mail size={24} className="text-gray-400" />
  }
}

export default function MissionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [profile, setProfile] = useState<MissionProfile | null>(null)
  const [showSubmissionForm, setShowSubmissionForm] = useState(false)
  const [proof, setProof] = useState('')
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [autoVerifyCountdown, setAutoVerifyCountdown] = useState<number | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
    if (user?.email === 'remgoficial@gmail.com') {
      setIsAdmin(true)
    }
  }, [user, authLoading, router])

  const [verificationDetails, setVerificationDetails] = useState<any>(null)
  
  const { data: mission, isLoading } = useSWR<Mission>(
    params?.id ? `/api/missions/${params.id}` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  // Load verification details when mission loads
  React.useEffect(() => {
    const loadVerification = async () => {
      if (params?.id) {
        try {
          const res = await fetch(`/api/mission-verifications?mission_id=${params.id}`)
          if (res.ok) {
            const data = await res.json()
            if (Array.isArray(data) && data.length > 0) {
              setVerificationDetails(data[0])
            }
          }
        } catch (err) {
          console.error('[v0] Error loading verification:', err)
        }
      }
    }
    loadVerification()
  }, [params?.id])

  // Clear state when mission ID changes
  React.useEffect(() => {
    setShowSubmissionForm(false)
    setProof('')
    setSubmitError('')
    setIsSubmitting(false)
    setAutoVerifyCountdown(null)
    setProfile(null)
    setVerificationDetails(null)
  }, [params?.id])

  const { data: userSubmissions } = useSWR<any[]>(
    user ? '/api/mission-submissions' : null,
    fetcher
  )

  // Check if user has already submitted
  const userSubmission = userSubmissions?.find((s) => s.mission_id === params?.id)
  const submissionStatus = userSubmission?.status

  // Handle automatic verification submission
  const handleAutoVerifySubmit = async () => {
    if (!autoVerifyCountdown) return
    try {
      console.log('[v0] Auto-verifying mission submission')
      const res = await fetch('/api/mission-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mission_id: params?.id,
          submission_proof: 'Auto-verified',
          submission_type: 'automatic',
        }),
      })
      if (!res.ok) {
        const errorData = await res.json()
        console.error('[v0] Auto-verify error:', errorData)
        throw new Error(errorData.error || 'Failed to auto-verify')
      }
      console.log('[v0] Mission auto-verified successfully')
      setShowSubmissionForm(false)
      setAutoVerifyCountdown(null)
      setProof('')
      window.location.reload()
    } catch (err: any) {
      console.error('[v0] Auto-verify submission error:', err)
      setSubmitError(err.message || 'Failed to complete mission')
      setAutoVerifyCountdown(null)
    }
  }

  // Load mission profile when mission loads
  React.useEffect(() => {
    const loadProfile = async () => {
      if (mission?.mission_profile_id) {
        try {
          const res = await fetch(`/api/mission-profiles/${mission.mission_profile_id}`)
          if (res.ok) {
            const data = await res.json()
            setProfile(data)
          }
        } catch (err) {
          console.error('[v0] Error loading profile:', err)
        }
      }
    }
    loadProfile()
  }, [mission?.mission_profile_id, mission?.verification_type])

  // Handle automatic verification countdown
  React.useEffect(() => {
    if (autoVerifyCountdown !== null && autoVerifyCountdown > 0) {
      const timer = setTimeout(() => {
        setAutoVerifyCountdown(autoVerifyCountdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (autoVerifyCountdown === 0) {
      // Countdown finished, submit automatically
      handleAutoVerifySubmit()
    }
  }, [autoVerifyCountdown, handleAutoVerifySubmit])

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background" />
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation isAdmin={isAdmin} />
        <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-sm border-b border-border px-4 py-4 flex items-center justify-between">
          <button className="p-2 hover:bg-muted rounded-lg transition">
            <ArrowLeft size={20} className="text-muted-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground flex-1 text-center">Loading...</h1>
          <div className="w-8"></div>
        </div>
        <div className="px-4 py-6 space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-muted rounded-xl"></div>
            <div className="h-40 bg-muted rounded-xl"></div>
            <div className="h-20 bg-muted rounded-lg"></div>
            <div className="h-96 bg-muted rounded-xl"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!mission) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation isAdmin={isAdmin} />
        <div className="text-center py-12">
          <p className="text-muted-foreground">Mission not found</p>
        </div>
      </div>
    )
  }

  const totalXP = mission.xp_reward + (mission.sub_missions?.reduce((sum, m) => sum + (m.xp_reward || 0), 0) || 0)
  const totalZeryT = mission.zeryt_reward + (mission.sub_missions?.reduce((sum, m) => sum + (m.zeryt_reward || 0), 0) || 0)
  const hasSubMissions = mission.sub_missions && mission.sub_missions.length > 0

  return (
    <div key={params?.id} className="min-h-screen bg-background">
      <Navigation isAdmin={isAdmin} />

      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-sm border-b border-border px-4 py-4 flex items-center justify-between">
        <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-lg transition">
          <ArrowLeft size={20} className="text-muted-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground flex-1 text-center">Mission Details</h1>
        <div className="w-8"></div>
      </div>

      {/* Mission Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Mission Profile Card */}
        {profile && (
          <div className="bg-card rounded-xl border border-border p-5 hover:border-primary/50 transition-colors">
            <div className="flex items-start gap-4">
              {profile.logo_url && (
                <img
                  src={profile.logo_url || "/placeholder.svg"}
                  alt={profile.name}
                  className="w-16 h-16 rounded-lg object-cover border border-border flex-shrink-0"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              )}
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Partner</p>
                <h3 className="text-lg font-bold text-foreground mb-1">{profile.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{profile.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* Mission Header */}
        <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl border border-primary/20 p-4 md:p-6">
          <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
            {mission.image_url && (
              <img
                src={mission.image_url || "/placeholder.svg"}
                alt={mission.title}
                className="w-14 h-14 md:w-20 md:h-20 rounded-lg object-cover border border-border flex-shrink-0"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl md:text-3xl font-bold text-foreground line-clamp-2">{mission.title}</h2>
              <p className="text-xs font-semibold text-primary mt-1 uppercase tracking-wider">{mission.category}</p>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs md:text-sm text-foreground leading-relaxed mb-3 md:mb-4 line-clamp-3">
            {mission.description || mission.brief || 'No description available'}
          </p>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            <div className="bg-card/50 rounded-lg p-3 md:p-4">
              <p className="text-xs text-muted-foreground mb-1">XP Reward</p>
              <p className="text-lg md:text-xl font-bold text-primary">⚡ {mission.xp_reward ? mission.xp_reward.toLocaleString() : '0'}</p>
            </div>
            <div className="bg-card/50 rounded-lg p-3 md:p-4">
              <p className="text-xs text-muted-foreground mb-1">ZeryT Reward</p>
              <p className="text-lg md:text-xl font-bold text-accent">💎 {mission.zeryt_reward ? mission.zeryt_reward.toLocaleString() : '0'}</p>
            </div>
          </div>

          {/* Mission Schedule & Metadata */}
          <div className="space-y-3">
            {/* Schedule Type */}
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
              <p className="text-xs font-semibold uppercase mb-2 text-primary">Availability</p>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">
                  {mission.schedule_type === 'unlimited' ? '♾️ Unlimited - Available anytime' :
                   mission.schedule_type === 'daily' ? '📅 Daily - Repeats every day' :
                   mission.schedule_type === 'weekly' ? '📅 Weekly - Repeats every week' :
                   mission.schedule_type === 'monthly' ? '📅 Monthly - Repeats every month' :
                   mission.schedule_type === 'date_specific' ? '📅 Limited Time' : '📅 One-time only'}
                </p>
                {mission.schedule_start_date && (
                  <p className="text-xs text-muted-foreground">
                    Available: {mission.schedule_start_date ? new Date(mission.schedule_start_date).toLocaleDateString() : 'N/A'}
                    {mission.schedule_start_time && ` at ${mission.schedule_start_time}`}
                  </p>
                )}
                {mission.schedule_end_date && (
                  <p className="text-xs text-muted-foreground">
                    Ends: {mission.schedule_end_date ? new Date(mission.schedule_end_date).toLocaleDateString() : 'N/A'}
                    {mission.schedule_end_time && ` at ${mission.schedule_end_time}`}
                  </p>
                )}
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 bg-card/30 rounded-lg p-3">
              <div>
                <p className="text-xs font-semibold uppercase mb-0.5">Type</p>
                <p className="text-foreground text-xs md:text-sm capitalize">{mission.category || 'General'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase mb-0.5">Created</p>
                <p className="text-foreground text-xs md:text-sm">{mission.created_at ? new Date(mission.created_at).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div className="col-span-2 md:col-span-1">
                <p className="text-xs font-semibold uppercase mb-0.5">Status</p>
                <p className={`text-xs md:text-sm font-semibold ${mission.status === 'active' ? 'text-primary' : 'text-muted-foreground'}`}>
                  {mission.status === 'active' ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Requirements Section */}
        {hasSubMissions && (
          <div>
            <h3 className="text-base md:text-lg font-bold text-foreground mb-3 md:mb-4">Requirements ({mission.sub_missions.length})</h3>

            <div className="space-y-2 md:space-y-3">
              {mission.sub_missions.map((subMission, index) => {
                const hasRewards = subMission.xp_reward > 0 || subMission.zeryt_reward > 0
                return (
                  <div
                    key={subMission.id || index}
                    className="bg-card rounded-lg border border-border hover:border-primary/50 p-3 md:p-4 transition cursor-pointer group"
                  >
                    <div className="flex items-start gap-2 md:gap-3">
                      {/* Platform Icon */}
                      <div className="mt-0.5 flex-shrink-0 p-1.5 md:p-2 bg-muted rounded-lg group-hover:bg-muted/80 transition">
                        <div className="scale-75 md:scale-100 origin-top-left">
                          {getPlatformIcon(subMission.verification_type, mission.social_network_id)}
                        </div>
                      </div>

                      {/* Task Content */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground text-xs md:text-sm mb-0.5">
                          {subMission.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {subMission.description}
                        </p>

                        {/* Rewards Display */}
                        {hasRewards && (
                          <div className="flex gap-1.5 md:gap-2 items-center flex-wrap">
                            {subMission.xp_reward > 0 && (
                              <span className="text-xs font-semibold text-accent bg-accent/20 px-1.5 py-0.5 md:px-2 md:py-1 rounded">
                                +{Math.round(subMission.xp_reward)} XP
                              </span>
                            )}
                            {subMission.zeryt_reward > 0 && (
                              <span className="text-xs font-semibold text-primary bg-primary/20 px-1.5 py-0.5 md:px-2 md:py-1 rounded">
                                +{Math.round(subMission.zeryt_reward)} ZeryT
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Submission Form Modal */}
        {showSubmissionForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4 md:p-0">
            <div className="bg-card border border-border rounded-xl md:rounded-2xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto md:max-h-[90vh]">
              <h2 className="text-xl font-bold text-foreground mb-4">Complete Mission</h2>
              
              {/* Verification Info */}
              <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 mb-4">
                <p className="text-xs font-semibold uppercase mb-2 text-foreground">
                  How to submit:
                </p>
                {(verificationDetails?.verification_type || mission.verification_type) === 'automatic' ? (
                  <div className="text-sm text-foreground space-y-1">
                    <p className="font-medium">✓ Instant Completion</p>
                    <p className="text-xs text-muted-foreground">
                      This mission will be marked as completed immediately when you submit
                    </p>
                  </div>
                ) : (verificationDetails?.verification_type || mission.verification_type) === 'text' ? (
                  <div className="text-sm text-foreground space-y-1">
                    <p className="font-medium">📝 Text Submission</p>
                    <p className="text-xs text-muted-foreground">
                      {verificationDetails?.text_label || 'Enter the required text information below'}
                    </p>
                  </div>
                ) : (verificationDetails?.verification_type || mission.verification_type) === 'image' ? (
                  <div className="text-sm text-foreground space-y-1">
                    <p className="font-medium">📸 Image Upload</p>
                    <p className="text-xs text-muted-foreground">
                      Upload a screenshot or image as proof
                    </p>
                  </div>
                ) : (verificationDetails?.verification_type || mission.verification_type) === 'link' ? (
                  <div className="text-sm text-foreground space-y-1">
                    <p className="font-medium">🔗 Link Submission</p>
                    <p className="text-xs text-muted-foreground">
                      Submit a URL or link as verification
                    </p>
                  </div>
                ) : (
                  <div className="text-sm text-foreground space-y-1">
                    <p className="font-medium">📋 Submit Proof</p>
                    <p className="text-xs text-muted-foreground">
                      Provide proof of mission completion
                    </p>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                {submitError && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                    <p className="text-sm text-destructive">{submitError}</p>
                  </div>
                )}
                
                {/* Automatic - No input needed */}
                {(verificationDetails?.verification_type || mission.verification_type) === 'automatic' ? (
                  <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
                    {autoVerifyCountdown !== null ? (
                      <p className="text-sm text-foreground text-center font-medium">
                        ⏳ Completing mission in {autoVerifyCountdown}s...
                      </p>
                    ) : (
                      <p className="text-sm text-foreground text-center font-medium">
                        Click submit to complete this mission instantly
                      </p>
                    )}
                  </div>
                ) : (verificationDetails?.verification_type || mission.verification_type) === 'text' ? (
                  <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-2">
                      {verificationDetails?.text_label || 'Submit Text'}
                    </label>
                    <textarea
                      value={proof}
                      onChange={(e) => {
                        setProof(e.target.value)
                        setSubmitError('')
                      }}
                      placeholder={verificationDetails?.text_example || 'Enter the required text here...'}
                      rows={3}
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition resize-none"
                      disabled={isSubmitting}
                    />
                  </div>
                ) : (verificationDetails?.verification_type || mission.verification_type) === 'link' ? (
                  <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-2">
                      {verificationDetails?.link_description || 'Proof Link / URL'}
                    </label>
                    <textarea
                      value={proof}
                      onChange={(e) => {
                        setProof(e.target.value)
                        setSubmitError('')
                      }}
                      placeholder={`Paste your proof link (must be from ${verificationDetails?.link_domain || 'the required domain'})...`}
                      rows={3}
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition resize-none"
                      disabled={isSubmitting}
                    />
                  </div>
                ) : (verificationDetails?.verification_type || mission.verification_type) === 'image' ? (
                  <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-2">
                      Upload Screenshot / Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          const file = e.target.files[0]
                          setProofFile(file)
                          setProof(file.name)
                          setSubmitError('')
                          // Generate preview
                          const reader = new FileReader()
                          reader.onload = (event) => {
                            setProofPreview(event.target?.result as string)
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground cursor-pointer focus:outline-none focus:border-primary transition"
                      disabled={isSubmitting}
                    />
                    {proofFile && <p className="text-xs text-primary mt-1">✓ File selected: {proofFile.name}</p>}
                    {proofPreview && (
                      <div className="mt-3 border border-border rounded-lg overflow-hidden">
                        <img src={proofPreview || "/placeholder.svg"} alt="Preview" className="w-full max-h-64 object-contain bg-muted" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-semibold text-muted-foreground mb-2">
                        Proof Link (Optional)
                      </label>
                      <textarea
                        value={proof}
                        onChange={(e) => {
                          setProof(e.target.value)
                          setSubmitError('')
                        }}
                        placeholder="Paste a link or URL..."
                        rows={2}
                        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition resize-none"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-muted-foreground mb-2">
                        Or Upload Image
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            const file = e.target.files[0]
                            setProofFile(file)
                            setSubmitError('')
                            // Generate preview
                            const reader = new FileReader()
                            reader.onload = (event) => {
                              setProofPreview(event.target?.result as string)
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground cursor-pointer focus:outline-none focus:border-primary transition"
                        disabled={isSubmitting}
                      />
                      {proofFile && <p className="text-xs text-primary mt-1">✓ File selected: {proofFile.name}</p>}
                      {proofPreview && (
                        <div className="mt-3 border border-border rounded-lg overflow-hidden">
                          <img src={proofPreview || "/placeholder.svg"} alt="Preview" className="w-full max-h-64 object-contain bg-muted" />
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (!proof && mission.verification_type !== 'automatic') {
                        setSubmitError('Please provide proof (link or image)')
                        return
                      }
                      setIsSubmitting(true)
                      
                      // For automatic verification, start countdown
                      if (mission.verification_type === 'automatic') {
                        console.log('[v0] Starting auto-verify countdown')
                        setAutoVerifyCountdown(10)
                        setIsSubmitting(false)
                        return
                      }
                      
                      try {
                        const submissionData: any = {
                          mission_id: params?.id,
                          submission_proof: proof,
                          submission_url: mission.verification_method === 'auto' ? proof : null,
                        }
                        
                        // If image was selected, add it to the submission
                        if (proofPreview) {
                          submissionData.submission_image = proofPreview
                        }
                        
                        const res = await fetch('/api/mission-submissions', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(submissionData),
                        })
                        if (!res.ok) {
                          const errorData = await res.json()
                          throw new Error(errorData.error || 'Failed to submit')
                        }
                        setShowSubmissionForm(false)
                        setProof('')
                        setProofFile(null)
                        setSubmitError('')
                        // Refresh user submissions
                        window.location.reload()
                      } catch (err: any) {
                        setSubmitError(err.message || 'Failed to submit proof')
                      } finally {
                        setIsSubmitting(false)
                      }
                    }}
                    disabled={isSubmitting || autoVerifyCountdown !== null}
                    className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-gray-600 text-primary-foreground font-bold py-2 rounded-lg transition"
                  >
                    {autoVerifyCountdown !== null ? `Completing in ${autoVerifyCountdown}s` : isSubmitting ? 'Submitting...' : 'Submit'}
                  </button>
                  <button
                    onClick={() => {
                      setShowSubmissionForm(false)
                      setProof('')
                      setProofFile(null)
                      setSubmitError('')
                    }}
                    disabled={isSubmitting}
                    className="flex-1 bg-muted hover:bg-muted/80 disabled:bg-gray-600 text-foreground font-bold py-2 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Complete Mission Button */}
        <div className="sticky bottom-20 left-4 right-4 flex gap-2 z-40">
          <button
            onClick={() => {
              setShowSubmissionForm(true)
              setSubmitError('')
            }}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-4 rounded-lg transition"
          >
            Complete Mission
          </button>
        </div>

        {/* Padding to avoid content hidden by navigation */}
        <div className="h-24"></div>
      </div>
    </div>
    )
  }
