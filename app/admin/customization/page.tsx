'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/Navigation'
import { Save, RotateCcw, Eye, EyeOff } from 'lucide-react'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface CustomizationConfig {
  id?: string
  primary_color: string
  primary_foreground: string
  secondary_color: string
  secondary_foreground: string
  accent_color: string
  accent_foreground: string
  background_color: string
  foreground_color: string
  muted_bg: string
  muted_fg: string
  border_color: string
  card_bg: string
  font_sans: string
  font_mono: string
  heading_font: string
  base_font_size: number
  heading_line_height: number
  body_line_height: number
  site_name: string
  site_description: string
  logo_url: string
  favicon_url: string
  header_icon_url: string
  footer_icon_url: string
  navbar_style: string
  theme_mode: string
  rounded_corners: string
}

const ColorPicker = ({ 
  label, 
  value, 
  onChange 
}: { 
  label: string
  value: string
  onChange: (val: string) => void
}) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium">{label}</label>
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-16 h-10 rounded cursor-pointer border border-border"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 px-3 py-2 border border-border rounded bg-background"
        placeholder="#000000"
      />
    </div>
  </div>
)

export default function CustomizationPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  const { data: config, mutate: refetchConfig } = useSWR<CustomizationConfig>(
    isAdmin ? '/api/admin/site-customization' : null,
    fetcher
  )

  const [formData, setFormData] = useState<CustomizationConfig>({
    primary_color: '#3b82f6',
    primary_foreground: '#ffffff',
    secondary_color: '#8b5cf6',
    secondary_foreground: '#ffffff',
    accent_color: '#ec4899',
    accent_foreground: '#ffffff',
    background_color: '#ffffff',
    foreground_color: '#000000',
    muted_bg: '#f3f4f6',
    muted_fg: '#6b7280',
    border_color: '#e5e7eb',
    card_bg: '#ffffff',
    font_sans: 'Inter, sans-serif',
    font_mono: 'Fira Code, monospace',
    heading_font: 'Poppins, sans-serif',
    base_font_size: 16,
    heading_line_height: 1.2,
    body_line_height: 1.6,
    site_name: 'ZeryTask',
    site_description: '',
    logo_url: '',
    favicon_url: '',
    header_icon_url: '',
    footer_icon_url: '',
    navbar_style: 'default',
    theme_mode: 'light',
    rounded_corners: 'medium',
  })

  // Load config when user is admin
  useEffect(() => {
    if (!authLoading && user) {
      const checkAdmin = async () => {
        const res = await fetch('/api/admin/check')
        const data = await res.json()
        setIsAdmin(data.isAdmin)
      }
      checkAdmin()
    }
  }, [user, authLoading])

  // Update form when config is loaded
  useEffect(() => {
    if (config) {
      setFormData(prev => ({ ...prev, ...config }))
    }
  }, [config])

  if (!isAdmin && !authLoading) {
    return <div className="p-4 text-center">Access denied</div>
  }

  const handleSave = async () => {
    setIsSaving(true)
    setMessage('')
    try {
      const res = await fetch('/api/admin/site-customization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        setMessage('Changes saved successfully!')
        refetchConfig()
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage('Error saving changes')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = async () => {
    if (!confirm('Reset to default? This action cannot be undone.')) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/admin/site-customization', {
        method: 'PUT',
      })
      if (res.ok) {
        const data = await res.json()
        setFormData(data)
        setMessage('Reset to default successfully!')
        setTimeout(() => setMessage(''), 3000)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleRollback = async () => {
    if (!confirm('Restore previous version?')) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/admin/site-customization', {
        method: 'PATCH',
      })
      if (res.ok) {
        const data = await res.json()
        setFormData(data)
        setMessage('Restored to previous version!')
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage('No previous version available')
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Website Customization</h1>
              <p className="text-muted-foreground">Customize colors, typography, branding, and more</p>
            </div>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition"
            >
              {showPreview ? <EyeOff size={18} /> : <Eye size={18} />}
              {showPreview ? 'Hide' : 'Show'} Preview
            </button>
          </div>

          {message && (
            <div className={`mb-4 p-4 rounded-lg ${message.includes('successfully') ? 'bg-green-500/10 text-green-700' : 'bg-red-500/10 text-red-700'}`}>
              {message}
            </div>
          )}

          <div className={`grid gap-6 ${showPreview ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
            {/* Form */}
            <div className="space-y-6">
              {/* Branding */}
              <div className="border border-border rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Branding</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Site Name</label>
                    <input
                      type="text"
                      value={formData.site_name}
                      onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded bg-background"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      value={formData.site_description}
                      onChange={(e) => setFormData({ ...formData, site_description: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded bg-background"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Logo URL</label>
                    <input
                      type="url"
                      value={formData.logo_url}
                      onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded bg-background"
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Favicon URL</label>
                    <input
                      type="url"
                      value={formData.favicon_url}
                      onChange={(e) => setFormData({ ...formData, favicon_url: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded bg-background"
                      placeholder="https://example.com/favicon.ico"
                    />
                  </div>
                </div>
              </div>

              {/* Colors */}
              <div className="border border-border rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Color Palette</h2>
                <div className="grid grid-cols-2 gap-4">
                  <ColorPicker label="Primary" value={formData.primary_color} onChange={(v) => setFormData({ ...formData, primary_color: v })} />
                  <ColorPicker label="Secondary" value={formData.secondary_color} onChange={(v) => setFormData({ ...formData, secondary_color: v })} />
                  <ColorPicker label="Accent" value={formData.accent_color} onChange={(v) => setFormData({ ...formData, accent_color: v })} />
                  <ColorPicker label="Background" value={formData.background_color} onChange={(v) => setFormData({ ...formData, background_color: v })} />
                  <ColorPicker label="Border" value={formData.border_color} onChange={(v) => setFormData({ ...formData, border_color: v })} />
                  <ColorPicker label="Muted" value={formData.muted_bg} onChange={(v) => setFormData({ ...formData, muted_bg: v })} />
                </div>
              </div>

              {/* Typography */}
              <div className="border border-border rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Typography</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Body Font</label>
                    <input
                      type="text"
                      value={formData.font_sans}
                      onChange={(e) => setFormData({ ...formData, font_sans: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded bg-background"
                      placeholder="Inter, sans-serif"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Heading Font</label>
                    <input
                      type="text"
                      value={formData.heading_font}
                      onChange={(e) => setFormData({ ...formData, heading_font: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded bg-background"
                      placeholder="Poppins, sans-serif"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Base Size (px)</label>
                      <input
                        type="number"
                        value={formData.base_font_size}
                        onChange={(e) => setFormData({ ...formData, base_font_size: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-border rounded bg-background"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Line Height</label>
                      <input
                        type="number"
                        value={formData.body_line_height}
                        onChange={(e) => setFormData({ ...formData, body_line_height: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-border rounded bg-background"
                        step="0.1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Layout */}
              <div className="border border-border rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Layout</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Theme Mode</label>
                    <select
                      value={formData.theme_mode}
                      onChange={(e) => setFormData({ ...formData, theme_mode: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded bg-background"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Rounded Corners</label>
                    <select
                      value={formData.rounded_corners}
                      onChange={(e) => setFormData({ ...formData, rounded_corners: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded bg-background"
                    >
                      <option value="none">None</option>
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Navbar Style</label>
                    <select
                      value={formData.navbar_style}
                      onChange={(e) => setFormData({ ...formData, navbar_style: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded bg-background"
                    >
                      <option value="default">Default</option>
                      <option value="minimal">Minimal</option>
                      <option value="floating">Floating</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 sticky bottom-0 bg-background p-4 border-t border-border">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:bg-primary/90 disabled:opacity-60"
                >
                  <Save size={18} />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleRollback}
                  disabled={isSaving}
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-border rounded-lg hover:bg-muted disabled:opacity-60"
                  title="Restore previous version"
                >
                  <RotateCcw size={18} />
                  Rollback
                </button>
                <button
                  onClick={handleReset}
                  disabled={isSaving}
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-border rounded-lg hover:bg-muted disabled:opacity-60"
                  title="Reset to defaults"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Preview */}
            {showPreview && (
              <div className="sticky top-6 h-fit">
                <div className="border border-border rounded-lg p-6 overflow-hidden" style={{
                  backgroundColor: formData.background_color,
                  color: formData.foreground_color,
                }}>
                  <h3 className="text-lg font-bold mb-4">Live Preview</h3>
                  
                  {formData.logo_url && (
                    <img src={formData.logo_url} alt="Logo" className="w-12 h-12 rounded-lg mb-4 object-cover" />
                  )}
                  
                  <h1 style={{ fontFamily: formData.heading_font, fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
                    {formData.site_name}
                  </h1>
                  <p style={{ fontFamily: formData.font_sans, fontSize: `${formData.base_font_size}px`, lineHeight: formData.body_line_height }}>
                    {formData.site_description || 'Your website description'}
                  </p>

                  <div className="mt-6 space-y-3">
                    <button style={{
                      backgroundColor: formData.primary_color,
                      color: formData.primary_foreground,
                    }} className="w-full py-2 rounded font-bold">
                      Primary Button
                    </button>
                    <button style={{
                      backgroundColor: formData.secondary_color,
                      color: formData.secondary_foreground,
                    }} className="w-full py-2 rounded font-bold">
                      Secondary Button
                    </button>
                    <button style={{
                      borderColor: formData.border_color,
                      color: formData.foreground_color,
                    }} className="w-full py-2 rounded font-bold border">
                      Border Button
                    </button>
                  </div>

                  <div style={{
                    backgroundColor: formData.muted_bg,
                    color: formData.muted_fg,
                  }} className="mt-6 p-4 rounded">
                    <p style={{ fontFamily: formData.font_sans }}>
                      Muted section
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
