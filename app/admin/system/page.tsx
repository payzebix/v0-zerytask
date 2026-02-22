'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Navigation } from '@/components/Navigation'
import { AlertCircle, Download, Upload, Power, Clock } from 'lucide-react'
import useSWR from 'swr'

interface UserProfile {
  is_admin: boolean
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function SystemMaintenancePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [maintenanceMessage, setMaintenanceMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [backupLoading, setBackupLoading] = useState(false)
  const [restoreLoading, setRestoreLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')

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

  useEffect(() => {
    const fetchMaintenanceStatus = async () => {
      try {
        const res = await fetch('/api/admin/maintenance')
        if (res.ok) {
          const data = await res.json()
          setMaintenanceMode(data.maintenanceMode)
          setMaintenanceMessage(data.maintenanceMessage)
        } else if (res.status === 503) {
          // Database tables not initialized
          setMessage('Database setup required. Please go to /setup to initialize the database.')
          setMessageType('error')
        }
      } catch (error) {
        console.error('Error fetching maintenance status:', error)
        setMessage('Error loading maintenance status')
        setMessageType('error')
      }
    }

    if (isAdmin) {
      fetchMaintenanceStatus()
    }
  }, [isAdmin])

  const handleMaintenanceToggle = async () => {
    setLoading(true)
    setMessage('')

    try {
      const res = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: !maintenanceMode,
          message: maintenanceMessage,
        }),
      })

      if (res.ok) {
        setMaintenanceMode(!maintenanceMode)
        setMessage(!maintenanceMode ? 'Maintenance mode enabled' : 'Maintenance mode disabled')
        setMessageType('success')
      } else if (res.status === 503) {
        const data = await res.json()
        setMessage('Database setup required. Please go to /setup to initialize the database.')
        setMessageType('error')
      } else {
        throw new Error('Failed to update maintenance mode')
      }
    } catch (error) {
      setMessage('Error updating maintenance mode')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadBackup = async () => {
    setBackupLoading(true)
    setMessage('')

    try {
      const res = await fetch('/api/admin/backup')
      if (res.ok) {
        const data = await res.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `backup-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        setMessage('Backup downloaded successfully')
        setMessageType('success')
      }
    } catch (error) {
      setMessage('Error downloading backup')
      setMessageType('error')
    } finally {
      setBackupLoading(false)
    }
  }

  const handleRestoreBackup = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e: any) => {
      const file = e.target.files[0]
      if (!file) return

      setRestoreLoading(true)
      setMessage('')

      try {
        const text = await file.text()
        const backupData = JSON.parse(text)

        const res = await fetch('/api/admin/backup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(backupData),
        })

        if (res.ok) {
          const result = await res.json()
          setMessage(`Backup restored successfully. ${result.restoredTables.length} tables restored.`)
          setMessageType('success')
        } else {
          throw new Error('Failed to restore backup')
        }
      } catch (error) {
        setMessage('Error restoring backup: ' + (error instanceof Error ? error.message : 'Unknown error'))
        setMessageType('error')
      } finally {
        setRestoreLoading(false)
      }
    }
    input.click()
  }

  if (authLoading || !isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 pb-24">
      <Navigation isAdmin={isAdmin} />

      <div className="px-4 py-6">
        <h1 className="text-3xl font-bold text-white mb-2">System Administration</h1>
        <p className="text-gray-400 mb-6">Manage maintenance mode and data backup</p>

        {/* Status Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg border-l-4 ${
              messageType === 'success'
                ? 'bg-green-500/10 border-green-500 text-green-400'
                : 'bg-red-500/10 border-red-500 text-red-400'
            }`}
          >
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Maintenance Mode */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <AlertCircle size={24} className="text-orange-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Maintenance Mode</h2>
                <p className="text-sm text-gray-400 mt-1">Control system availability</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-300 mb-2 block">
                  Maintenance Message
                </label>
                <textarea
                  value={maintenanceMessage}
                  onChange={(e) => setMaintenanceMessage(e.target.value)}
                  placeholder="System under maintenance..."
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary resize-none"
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                <div className={`w-3 h-3 rounded-full ${maintenanceMode ? 'bg-red-500' : 'bg-green-500'}`}></div>
                <span className="text-sm text-gray-300">
                  Status: <span className="font-bold">{maintenanceMode ? 'ACTIVE' : 'INACTIVE'}</span>
                </span>
              </div>

              <button
                onClick={handleMaintenanceToggle}
                disabled={loading}
                className={`w-full py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                  maintenanceMode
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-orange-600 hover:bg-orange-700 text-white'
                }`}
              >
                <Power size={18} />
                {maintenanceMode ? 'Disable Maintenance' : 'Enable Maintenance'}
              </button>

              <p className="text-xs text-gray-400 text-center mt-3">
                {maintenanceMode
                  ? 'Only admins can log in when maintenance mode is active'
                  : 'All users can access the system'}
              </p>
            </div>
          </div>

          {/* Backup & Restore */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Clock size={24} className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Backup & Restore</h2>
                <p className="text-sm text-gray-400 mt-1">Manage system data</p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleDownloadBackup}
                disabled={backupLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Download size={18} />
                {backupLoading ? 'Creating Backup...' : 'Download Backup'}
              </button>

              <button
                onClick={handleRestoreBackup}
                disabled={restoreLoading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Upload size={18} />
                {restoreLoading ? 'Restoring...' : 'Restore from File'}
              </button>

              <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-xs text-gray-400 space-y-2">
                <p>
                  <span className="font-semibold text-gray-300">Backup includes:</span>
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>All users and profiles</li>
                  <li>Missions and configurations</li>
                  <li>Submissions and statistics</li>
                  <li>Invitation codes</li>
                </ul>
              </div>

              <p className="text-xs text-yellow-400 text-center pt-2">
                ⚠️ Restore will replace all existing data
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
