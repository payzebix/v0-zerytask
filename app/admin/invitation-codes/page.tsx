'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus, Copy, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import useSWR from 'swr'
import { useAuth } from '@/hooks/useAuth'

interface InvitationCode {
  id: string
  code: string
  is_used: boolean
  used_by?: string
  used_at?: string
  expires_at?: string
  status: string
  created_at: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function InvitationCodesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [generatingCodes, setGeneratingCodes] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [quantity, setQuantity] = useState(5)
  const [expiresInDays, setExpiresInDays] = useState(30)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const { data: codes = [], mutate } = useSWR<InvitationCode[]>(
    isAdmin ? '/api/admin/invitation-codes' : null,
    fetcher
  )

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }
    if (user?.email === 'remgoficial@gmail.com') {
      setIsAdmin(true)
    }
  }, [user, authLoading, router])

  const handleGenerateCodes = async () => {
    if (quantity < 1) {
      alert('Quantity must be at least 1')
      return
    }

    setGeneratingCodes(true)
    try {
      const response = await fetch('/api/admin/invitation-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity,
          expires_in_days: expiresInDays,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      const result = await response.json()
      alert(`Created ${result.codes.length} invitation code(s)`)
      setShowForm(false)
      setQuantity(5)
      setExpiresInDays(30)
      mutate()
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to generate codes'}`)
    } finally {
      setGeneratingCodes(false)
    }
  }

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const getStatusColor = (status: string, isUsed: boolean) => {
    if (isUsed) return 'bg-blue-900/30 border-blue-500/50 text-blue-400'
    if (status === 'expired') return 'bg-red-900/30 border-red-500/50 text-red-400'
    if (status === 'revoked') return 'bg-red-900/30 border-red-500/50 text-red-400'
    return 'bg-green-900/30 border-green-500/50 text-green-400'
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400">Only admins can manage invitation codes</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-sm border-b border-slate-800 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Invitation Codes</h1>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-teal-600 hover:bg-teal-700 gap-2"
          >
            <Plus size={16} />
            Generate Codes
          </Button>
        </div>
      </div>

      {/* Generation Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">Generate Invitation Codes</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Expires in (days) - Leave 0 for no expiration
                </label>
                <input
                  type="number"
                  min="0"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleGenerateCodes}
                  disabled={generatingCodes}
                  className="flex-1 bg-teal-600 hover:bg-teal-700"
                >
                  {generatingCodes ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Generate'
                  )}
                </Button>
                <Button
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600"
                  disabled={generatingCodes}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {codes.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
            <p className="text-slate-400 mb-4">No invitation codes yet</p>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Create the first code
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {codes.map((code) => (
              <div
                key={code.id}
                className={`border rounded-lg p-4 transition ${getStatusColor(code.status, code.is_used)}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <code className="font-mono text-lg font-bold bg-black/30 px-3 py-2 rounded">
                        {code.code}
                      </code>
                      <button
                        onClick={() => copyToClipboard(code.code)}
                        className="p-2 hover:bg-white/10 rounded-lg transition"
                      >
                        {copiedCode === code.code ? (
                          <CheckCircle2 size={16} className="text-green-400" />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs">
                      {code.is_used ? (
                        <>
                          <span>✓ Used</span>
                          <span>
                            {new Date(code.used_at!).toLocaleDateString('es-ES')}
                          </span>
                        </>
                      ) : (
                        <>
                          <span>● Active</span>
                          {code.expires_at && (
                            <span>
                              Expires {new Date(code.expires_at).toLocaleDateString('es-ES')}
                            </span>
                          )}
                          {!code.expires_at && <span>Never expires</span>}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-xs whitespace-nowrap">
                    <div className="font-semibold">
                      {new Date(code.created_at).toLocaleDateString('es-ES')}
                    </div>
                    <div className="text-gray-400">
                      {code.is_used ? 'Used' : 'Available'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
