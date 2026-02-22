import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getAdminSupabaseClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    // Get maintenance status from settings table
    const { data: settings, error } = await supabase
      .from('app_settings')
      .select('maintenance_mode, maintenance_message')
      .limit(1)
      .single()

    // If table doesn't exist (PGRST205) or no data, return default values
    if (error && (error.code === 'PGRST205' || error.code === 'PGRST116')) {
      console.log('[v0] app_settings table empty or does not exist, using defaults')
      return NextResponse.json({
        maintenanceMode: false,
        maintenanceMessage: 'System under maintenance',
      })
    }

    if (error) {
      console.error('[v0] Error getting maintenance status:', error)
      return NextResponse.json({
        maintenanceMode: false,
        maintenanceMessage: 'System under maintenance',
      })
    }

    return NextResponse.json({
      maintenanceMode: settings?.maintenance_mode || false,
      maintenanceMessage: settings?.maintenance_message || 'System under maintenance',
    })
  } catch (error) {
    console.error('[v0] Error getting maintenance status:', error)
    return NextResponse.json({ maintenanceMode: false })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { maintenance_mode, message, setup_key } = await request.json()

    // Allow disabling maintenance with setup key during setup
    if (setup_key && setup_key === process.env.SETUP_KEY) {
      const adminSupabase = getAdminSupabaseClient()

      // Get or create the first app_settings record
      const { data: existingSettings } = await adminSupabase
        .from('app_settings')
        .select('id')
        .limit(1)
        .single()

      let updateData: any = {
        maintenance_mode,
        maintenance_message: message || 'System under maintenance',
        updated_at: new Date().toISOString(),
      }

      let error: any

      if (existingSettings?.id) {
        // Update existing record
        const response = await adminSupabase
          .from('app_settings')
          .update(updateData)
          .eq('id', existingSettings.id)

        error = response.error
      } else {
        // Insert new record
        updateData.id = crypto.randomUUID()
        updateData.created_at = new Date().toISOString()

        const response = await adminSupabase
          .from('app_settings')
          .insert([updateData])

        error = response.error
      }

      if (error) throw error

      return NextResponse.json({
        success: true,
        message: maintenance_mode ? 'Maintenance mode enabled' : 'Maintenance mode disabled',
      })
    }

    return NextResponse.json({ error: 'Invalid setup key' }, { status: 403 })
  } catch (error: any) {
    console.error('[v0] Error updating maintenance mode:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!userData?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { enabled, message } = await request.json()

    const adminSupabase = getAdminSupabaseClient()

    // Get or create the first app_settings record
    const { data: existingSettings } = await adminSupabase
      .from('app_settings')
      .select('id')
      .limit(1)
      .single()

    let updateData: any = {
      maintenance_mode: enabled,
      maintenance_message: message || 'System under maintenance. We will be back soon.',
      updated_at: new Date().toISOString(),
    }

    let upsertError: any

    if (existingSettings?.id) {
      // Update existing record
      const response = await adminSupabase
        .from('app_settings')
        .update(updateData)
        .eq('id', existingSettings.id)

      upsertError = response.error
    } else {
      // Insert new record
      updateData.id = crypto.randomUUID()
      updateData.created_at = new Date().toISOString()

      const response = await adminSupabase
        .from('app_settings')
        .insert([updateData])

      upsertError = response.error
    }

    // If table doesn't exist, return a message that setup is needed
    if (upsertError && upsertError.code === 'PGRST205') {
      console.log('[v0] app_settings table does not exist')
      return NextResponse.json({
        success: false,
        warning: 'Database tables need to be initialized',
        hint: 'Please go to /setup and complete the database setup process',
        maintenanceMode: enabled,
      }, { status: 503 })
    }

    if (upsertError) throw upsertError

    // If maintenance is being enabled, logout all non-admin users
    if (enabled) {
      console.log('[v0] Maintenance mode enabled - logging out non-admin users')
      // Note: This would require a more complex implementation to invalidate all sessions
      // For now, we just set the flag and let the client-side check handle it
    }

    return NextResponse.json({
      success: true,
      message: enabled ? 'Maintenance mode enabled' : 'Maintenance mode disabled',
    })
  } catch (error: any) {
    console.error('[v0] Error updating maintenance mode:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
