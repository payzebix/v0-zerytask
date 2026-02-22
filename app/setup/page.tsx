'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function SetupPage() {
  const [setupKey, setSetupKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [tablesCreated, setTablesCreated] = useState(false)
  const [adminCode, setAdminCode] = useState('')
  const [adminCodeCreated, setAdminCodeCreated] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [maintenanceDisabled, setMaintenanceDisabled] = useState(false)
  const [migrationsExecuted, setMigrationsExecuted] = useState(false)

  const handleCreateTables = async () => {
    if (!setupKey.trim()) {
      setError('Setup key is required')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/setup/create-tables', {
        method: 'POST',
        headers: {
          'x-setup-key': setupKey,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        // If it's a warning about manual setup needed
        if (response.status === 503) {
          setMessage(
            'Database tables need to be created manually.\n\n' +
            '1. Go to your Supabase dashboard\n' +
            '2. Open the SQL Editor\n' +
            '3. Run the migration scripts:\n' +
            '   - First: 00_complete_database_setup.sql\n' +
            '   - Then: 13_make_created_by_nullable.sql\n\n' +
            'After running the migrations, come back and click this button again.'
          )
          return
        }
        setError(data.error || 'Failed to create tables')
        return
      }

      setTablesCreated(true)
      setMessage('✓ Database tables verified successfully!')
    } catch (err) {
      setError('Error creating tables')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAdminCode = async () => {
    if (!setupKey.trim()) {
      setError('Setup key is required')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/setup/create-admin', {
        method: 'POST',
        headers: {
          'x-setup-key': setupKey,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create invitation code')
        return
      }

      setAdminCode(data.code)
      setAdminCodeCreated(true)
      setMessage(`✓ Admin invitation code created!\n\nCode: ${data.code}\n\nShare this code with the admin to register at /auth/signup`)
    } catch (err) {
      setError('Error creating invitation code')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(adminCode)
    setMessage(`Copied to clipboard: ${adminCode}`)
  }

  const handleDisableMaintenance = async () => {
    if (!setupKey.trim()) {
      setError('Setup key is required')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/admin/maintenance', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maintenance_mode: false,
          setup_key: setupKey,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to disable maintenance mode')
        return
      }

      setMaintenanceDisabled(true)
      setMessage('✓ Maintenance mode disabled successfully!')
    } catch (err) {
      setError('Error disabling maintenance mode')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleExecuteMigrations = async () => {
    if (!setupKey.trim()) {
      setError('Setup key is required')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/setup/execute-migrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          setup_key: setupKey,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to execute migrations')
        return
      }

      setMigrationsExecuted(true)
      setMessage(`✓ Migrations executed! Success: ${data.success_count}, Errors: ${data.error_count}`)
    } catch (err) {
      setError('Error executing migrations')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold mb-2">System Setup</h1>
        <p className="text-gray-600 text-sm mb-6">Initialize your Zerytask database and create admin registration code</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Setup Key</label>
            <Input
              type="password"
              placeholder="Enter setup key"
              value={setupKey}
              onChange={(e) => setSetupKey(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">Default: dev-setup-2024</p>
          </div>

          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm whitespace-pre-wrap">
              {message}
            </div>
          )}

          <div className="space-y-2">
            <Button
              onClick={handleCreateTables}
              disabled={loading || tablesCreated}
              className="w-full"
              variant={tablesCreated ? 'outline' : 'default'}
            >
              {tablesCreated && '✓ '}
              {loading && !tablesCreated ? 'Creating Tables...' : 'Step 1: Create Database Tables'}
            </Button>

            <Button
              onClick={handleExecuteMigrations}
              disabled={loading || !tablesCreated}
              className="w-full"
              variant={migrationsExecuted ? 'outline' : 'default'}
            >
              {migrationsExecuted && '✓ '}
              {loading && !migrationsExecuted ? 'Executing...' : 'Step 2: Execute All Migrations'}
            </Button>

            <Button
              onClick={handleCreateAdminCode}
              disabled={loading || !tablesCreated}
              className="w-full"
              variant={adminCodeCreated ? 'outline' : 'default'}
            >
              {adminCodeCreated && '✓ '}
              {loading && !adminCodeCreated ? 'Creating Code...' : 'Step 3: Generate Admin Code'}
            </Button>

            <Button
              onClick={handleDisableMaintenance}
              disabled={loading || !tablesCreated}
              className="w-full"
              variant={maintenanceDisabled ? 'outline' : 'default'}
            >
              {maintenanceDisabled && '✓ '}
              {loading && !maintenanceDisabled ? 'Disabling...' : 'Step 4: Disable Maintenance Mode'}
            </Button>
          </div>

          {adminCodeCreated && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm space-y-3">
              <div>
                <p className="font-medium mb-2">Setup Complete!</p>
                <p className="text-gray-700 mb-2">Admin registration code:</p>
                <div className="flex gap-2">
                  <code className="flex-1 p-2 bg-white border rounded font-mono text-sm">
                    {adminCode}
                  </code>
                  <Button
                    onClick={copyToClipboard}
                    size="sm"
                    variant="outline"
                  >
                    Copy
                  </Button>
                </div>
              </div>
              <div className="pt-2 border-t">
                <p className="text-gray-600 text-xs">
                  Share this code with the admin. They can use it to register at <strong>/auth/signup</strong>
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
