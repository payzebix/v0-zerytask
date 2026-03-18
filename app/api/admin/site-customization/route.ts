import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getAdminSupabaseClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

interface CustomizationConfig {
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

// GET current customization
export async function GET(request: NextRequest) {
  try {
    const supabase = getAdminSupabaseClient()

    const { data, error } = await supabase
      .from('site_customization')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('[v0] Error fetching customization:', error)
      return NextResponse.json(
        { error: 'Failed to fetch customization' },
        { status: 500 }
      )
    }

    return NextResponse.json(data || {})
  } catch (error) {
    console.error('[v0] Customization GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// UPDATE customization
export async function POST(request: NextRequest) {
  try {
    // Verify admin first with auth client
    const supabaseAuth = await createServerSupabaseClient()
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabaseAuth
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!userData?.is_admin) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    // Use admin client for database operations
    const supabase = getAdminSupabaseClient()

    const body = (await request.json()) as CustomizationConfig

    // Get current config for backup
    const { data: current } = await supabase
      .from('site_customization')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Update customization
    const { data, error } = await supabase
      .from('site_customization')
      .update({
        ...body,
        previous_version: current || null,
        version_number: (current?.version_number || 0) + 1,
        last_updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .order('created_at', { ascending: false })
      .limit(1)
      .select()
      .single()

    if (error) {
      console.error('[v0] Error updating customization:', error)
      return NextResponse.json(
        { error: 'Failed to update customization' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[v0] Customization POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// RESET to default
export async function PUT(request: NextRequest) {
  try {
    // Verify admin first
    const supabaseAuth = await createServerSupabaseClient()
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabaseAuth
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!userData?.is_admin) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    // Use admin client for operations
    const supabase = getAdminSupabaseClient()

    const defaultConfig = {
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
      site_description: 'Complete your missions and earn rewards',
      logo_url: '',
      favicon_url: '',
      header_icon_url: '',
      footer_icon_url: '',
      navbar_style: 'default',
      theme_mode: 'light',
      rounded_corners: 'medium',
    }

    const { data, error } = await supabase
      .from('site_customization')
      .update({
        ...defaultConfig,
        version_number: 1,
        last_updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .order('created_at', { ascending: false })
      .limit(1)
      .select()
      .single()

    if (error) {
      console.error('[v0] Error resetting customization:', error)
      return NextResponse.json(
        { error: 'Failed to reset customization' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[v0] Customization PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ROLLBACK to previous version
export async function PATCH(request: NextRequest) {
  try {
    // Verify admin first
    const supabaseAuth = await createServerSupabaseClient()
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabaseAuth
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!userData?.is_admin) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    // Use admin client for operations
    const supabase = getAdminSupabaseClient()

    // Get current config
    const { data: current } = await supabase
      .from('site_customization')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!current?.previous_version) {
      return NextResponse.json(
        { error: 'No previous version available' },
        { status: 400 }
      )
    }

    // Restore previous version
    const { data, error } = await supabase
      .from('site_customization')
      .update({
        ...current.previous_version,
        previous_version: current,
        last_updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', current.id)
      .select()
      .single()

    if (error) {
      console.error('[v0] Error rolling back customization:', error)
      return NextResponse.json(
        { error: 'Failed to rollback' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[v0] Customization PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
