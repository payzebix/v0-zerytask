'use client'

import React from "react"

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Navigation } from '@/components/Navigation'
import { ArrowLeft, Info } from 'lucide-react'
import useSWR from 'swr'

interface ExchangeConfig {
  zeryt_exchange_rate: number
  min_withdrawal_amount: number
}

interface ExchangeRequest {
  id: string
  zeryt_amount: number
  usdc_amount: number
  wallet_address: string
  status: 'pending' | 'paid' | 'rejected'
  created_at: string
  paid_at?: string
}

interface UserProfile {
  zeryt_balance: number
  is_admin?: boolean
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function ExchangePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [zerytAmount, setZerytAmount] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { data: config } = useSWR<ExchangeConfig>(
    user ? '/api/exchange/config' : null,
    fetcher
  )

  const { data: userProfile } = useSWR<UserProfile>(
    user ? '/api/users/me' : null,
    fetcher
  )

  const { data: exchanges, mutate: mutateExchanges } = useSWR<ExchangeRequest[]>(
    user ? '/api/exchange/request' : null,
    fetcher
  )

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  // Check if user is admin from profile
  useEffect(() => {
    if (userProfile) {
      setIsAdmin(userProfile.is_admin === true)
    }
  }, [userProfile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await fetch('/api/exchange/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zeryt_amount: parseInt(zerytAmount),
          wallet_address: walletAddress,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Exchange request failed')
      }

      setSuccess('Exchange request submitted successfully!')
      setZerytAmount('')
      setWalletAddress('')
      mutateExchanges()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const rate = config?.zeryt_exchange_rate || 0.05
  const minAmount = config?.min_withdrawal_amount || 500
  
  const memoizedCalculations = useMemo(() => {
    const usdcAmount = zerytAmount ? (parseInt(zerytAmount) * rate).toFixed(2) : '0.00'
    
    // Calculate available balance (subtract pending and paid exchanges)
    const exchangedAmount = exchanges?.reduce((sum, ex) => {
      if (ex.status === 'pending' || ex.status === 'paid') {
        return sum + ex.zeryt_amount
      }
      return sum
    }, 0) || 0
    
    const availableBalance = (userProfile?.zeryt_balance || 0) - exchangedAmount
    
    const canSubmit =
      zerytAmount &&
      parseInt(zerytAmount) >= minAmount &&
      walletAddress &&
      userProfile &&
      availableBalance >= parseInt(zerytAmount)
    
    return { usdcAmount, exchangedAmount, availableBalance, canSubmit }
  }, [zerytAmount, walletAddress, rate, minAmount, config, exchanges, userProfile])

  const { usdcAmount, exchangedAmount, availableBalance, canSubmit } = memoizedCalculations

  if (authLoading || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navigation isAdmin={isAdmin} />

      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-sm border-b border-border px-4 py-4 flex items-center justify-between">
        <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-lg transition">
          <ArrowLeft size={20} className="text-muted-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Exchange ZeryT</h1>
        <div className="w-8"></div>
      </div>

      {/* Available Balance */}
      <div className="px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground mb-3">Your Available Balance</p>
        <h2 className="text-5xl font-bold text-primary">
          {availableBalance.toLocaleString()}
        </h2>
        <p className="text-accent text-sm font-medium mt-2">ZeryT</p>
        {exchangedAmount > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            ({(userProfile?.zeryt_balance || 0).toLocaleString()} total - {exchangedAmount.toLocaleString()} pending)
          </p>
        )}
      </div>

      {/* Exchange Form */}
      <form onSubmit={handleSubmit} className="px-4 pb-8">
        <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
          {/* You Send */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase">You Send</p>
              <button
                type="button"
                onClick={() =>
                  setZerytAmount(Math.max(0, availableBalance).toString())
                }
                className="text-xs font-bold text-primary hover:text-primary/80 transition"
              >
                MAX
              </button>
            </div>
            <div className="flex items-center gap-3 bg-muted rounded-lg px-4 py-4 border border-border focus-within:border-primary transition-colors">
              <input
                type="number"
                value={zerytAmount}
                onChange={(e) => setZerytAmount(e.target.value)}
                placeholder="0"
                className="flex-1 bg-transparent text-foreground text-3xl font-bold outline-none placeholder-muted-foreground"
              />
              <span className="text-accent font-semibold">ZT</span>
            </div>
          </div>

          {/* Exchange Rate Display */}
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20 text-center">
            <p className="text-sm text-foreground font-semibold">
              {zerytAmount ? `${zerytAmount} ZT` : '1,000 ZT'} = $
              {zerytAmount ? (parseInt(zerytAmount) * rate).toFixed(2) : (1000 * rate).toFixed(2)} USDC
            </p>
            <p className="text-xs text-muted-foreground mt-1">1 ZT = ${rate} USDC</p>
          </div>

          {/* You Receive */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">You Receive</p>
            <div className="flex items-center gap-3 bg-muted rounded-lg px-4 py-4 border border-border">
              <input
                type="text"
                value={usdcAmount}
                disabled
                className="flex-1 bg-transparent text-foreground text-3xl font-bold outline-none"
              />
              <span className="text-primary font-semibold">USDC</span>
            </div>
          </div>

          {/* Wallet Address */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-3">
              Recipient Wallet Address
            </label>
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="0x1234...5678 (EVM/USDC)"
              className="w-full bg-muted rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground border border-border focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Info Box */}
          <div className="bg-accent/10 rounded-lg p-4 border border-accent/20">
            <div className="flex gap-3">
              <Info size={16} className="text-accent flex-shrink-0 mt-0.5" />
              <p className="text-xs text-foreground">
                Minimum: {minAmount.toLocaleString()} ZT • Usually processed within 24 hours
              </p>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-destructive/10 rounded-lg p-3 border border-destructive/20">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
              <p className="text-sm text-primary">{success}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground font-semibold py-4 rounded-lg transition"
          >
            {loading ? 'Processing Exchange...' : 'Request Exchange'}
          </button>
        </div>
      </form>

      {/* History */}
      {exchanges && exchanges.length > 0 && (
        <div className="px-4 pb-8">
          <h2 className="text-lg font-bold text-foreground mb-4">Recent Exchanges</h2>

          <div className="space-y-3">
            {exchanges.slice(0, 5).map((exchange) => {
              const statusConfig = {
                paid: { bg: 'bg-primary/10', border: 'border-primary/20', text: 'text-primary', icon: '✓', label: 'Completed' },
                pending: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-500', icon: '⏱', label: 'Pending' },
                rejected: { bg: 'bg-destructive/10', border: 'border-destructive/20', text: 'text-destructive', icon: '✕', label: 'Rejected' }
              }
              const config = statusConfig[exchange.status as keyof typeof statusConfig] || statusConfig.pending

              return (
                <div key={exchange.id} className={`${config.bg} rounded-lg p-4 border ${config.border} hover:border-primary/50 transition-colors`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`${config.text} text-lg font-bold flex-shrink-0`}>{config.icon}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {exchange.zeryt_amount.toLocaleString()} ZT → ${exchange.usdc_amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(exchange.created_at).toLocaleDateString()} • {new Date(exchange.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold ${config.text} flex-shrink-0`}>{config.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
