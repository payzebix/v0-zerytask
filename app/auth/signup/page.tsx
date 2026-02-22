'use client'

import { useState } from "react"
import React from "react"
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, UserPlus, Check, X } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [invitationCode, setInvitationCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [codeValidated, setCodeValidated] = useState(false)
  const [pay1810Available, setPay1810Available] = useState(true)
  const [validatingCode, setValidatingCode] = useState(false)

  // Load referral code from URL on mount
  useEffect(() => {
    const referralCode = searchParams.get('ref') || searchParams.get('referral')
    if (referralCode) {
      setInvitationCode(referralCode.toUpperCase().slice(0, 8))
      console.log('[v0] Loaded referral code from URL:', referralCode)
    }
  }, [searchParams])



  const validateInvitationCode = async () => {
    if (!invitationCode.trim()) {
      setError('Please enter an invitation code')
      return
    }

    setValidatingCode(true)
    setError('')

    try {
      const response = await fetch('/api/invitation-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: invitationCode }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Invalid invitation code')
        setCodeValidated(false)
        return
      }

      setCodeValidated(true)
    } catch (err) {
      setError('Failed to validate code')
      setCodeValidated(false)
    } finally {
      setValidatingCode(false)
    }
  }

  const getPasswordStrength = (pwd: string) => {
    let strength = 0
    if (pwd.length >= 8) strength++
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++
    if (/\d/.test(pwd)) strength++
    if (/[^a-zA-Z\d]/.test(pwd)) strength++
    return strength
  }

  const handlePasswordChange = (e: string) => {
    setPassword(e)
    setPasswordStrength(getPasswordStrength(e))
  }

  const getStrengthText = () => {
    switch (passwordStrength) {
      case 0:
        return 'Weak'
      case 1:
        return 'Weak'
      case 2:
        return 'Fair'
      case 3:
        return 'Good'
      case 4:
        return 'Strong'
      default:
        return 'Weak'
    }
  }

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 0:
        return '#4b5563'
      case 1:
        return '#ef4444'
      case 2:
        return '#f97316'
      case 3:
        return '#eab308'
      case 4:
        return '#14b8a6'
      default:
        return '#4b5563'
    }
  }



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      setError('Please fill in all required fields')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    // If PAY1810 is not available, code is mandatory
    if (!pay1810Available && !codeValidated) {
      setError('Please validate your invitation code first')
      return
    }

    // If PAY1810 is available but user entered a code, it must be validated
    if (pay1810Available && invitationCode.trim() && !codeValidated) {
      setError('Please validate your invitation code first')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, invitation_code: invitationCode }),
      })

      if (!response.ok) {
        const data = await response.json()

        // Handle specific error codes
        if (data.code === 'email_rate_limit') {
          setError('Too many signup attempts. Please wait a few minutes before trying again with a different email or try again later.')
          setLoading(false)
          return
        }

        if (data.code === 'user_exists') {
          setError('This email is already registered. Try logging in instead.')
          setLoading(false)
          return
        }

        throw new Error(data.error || 'Signup failed')
      }

      router.push('/auth/login')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 overflow-hidden relative">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent mb-6">
            <UserPlus size={28} className="text-background" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Create Account</h1>
          <p className="text-muted-foreground">Join and start earning rewards</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 bg-card rounded-2xl p-8 border border-border shadow-2xl">
          {/* Invitation Code Section */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground">
              Invitation Code {pay1810Available && <span className="text-muted-foreground/60"></span>}
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              {pay1810Available
                ? 'Enter your 8-character code'
                : 'Enter your 8-character invitation code to create an account'}
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={invitationCode}
                onChange={(e) => {
                  setInvitationCode(e.target.value.toUpperCase())
                  setCodeValidated(false)
                }}
                placeholder={pay1810Available ? '1A2B3C4D' : '1A2B3C4D'}
                maxLength={8}
                className="flex-1 bg-input border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all duration-200 font-mono uppercase"
              />
              <button
                type="button"
                onClick={validateInvitationCode}
                disabled={validatingCode || !invitationCode.trim() || invitationCode.length !== 8}
                className="px-4 py-3 bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground font-semibold rounded-lg transition-all duration-200 disabled:opacity-60 flex items-center gap-2"
              >
                {validatingCode ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                    Checking...
                  </>
                ) : (
                  'Verify'
                )}
              </button>
            </div>
            {codeValidated && (
              <div className="p-3 bg-accent/10 border border-accent/30 rounded-lg flex items-center gap-2 mt-2">
                <Check size={18} className="text-accent flex-shrink-0" />
                <p className="text-sm font-medium text-accent">Code verified!</p>
              </div>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all duration-200"
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all duration-200 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Password Strength */}
            <div className="mt-3 space-y-2">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex-1 h-1.5 rounded-full bg-muted transition-all duration-300"
                    style={{
                      backgroundColor: i < passwordStrength ? getStrengthColor() : undefined,
                    }}
                  />
                ))}
              </div>
              <p className="text-xs font-medium" style={{ color: getStrengthColor() }}>
                Strength: {getStrengthText()}
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 mt-6 disabled:opacity-60"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                Creating account...
              </>
            ) : (
              <>
                <UserPlus size={18} />
                Sign Up
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary font-semibold hover:text-primary/80 transition-colors">
              Sign in here
            </Link>
          </p>
        </div>

        {/* Terms */}
        <p className="text-xs text-muted-foreground/60 text-center mt-6">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
