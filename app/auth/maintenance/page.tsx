'use client'

import { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'

export default function MaintenancePage() {
  const [message, setMessage] = useState('System under maintenance. We will be back soon.')

  useEffect(() => {
    const fetchMaintenanceMessage = async () => {
      try {
        const res = await fetch('/api/admin/maintenance')
        if (res.ok) {
          const data = await res.json()
          setMessage(data.maintenanceMessage)
        }
      } catch (error) {
        console.error('Error fetching maintenance message:', error)
      }
    }

    fetchMaintenanceMessage()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full animate-pulse"></div>
            <AlertCircle size={80} className="text-orange-500 relative" />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-white mb-4">System Maintenance</h1>
        <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">{message}</p>

        <div className="space-y-4">
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mb-6">
            <p className="text-sm text-orange-400 font-medium">
              We're working to improve your experience. Please check back shortly.
            </p>
          </div>

          <div className="inline-block">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="animate-spin">
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
              </div>
              Estimated downtime: Less than 1 hour
            </div>
          </div>
        </div>

        <div className="mt-12 text-gray-500 text-sm">
          <p>Questions? Contact support@system.local</p>
        </div>
      </div>
    </div>
  )
}
