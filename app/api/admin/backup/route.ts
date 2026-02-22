import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getAdminSupabaseClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
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

    const adminSupabase = getAdminSupabaseClient()

    // Fetch all tables data
    const tables = [
      'users',
      'admin_config',
      'mission_profiles',
      'mission_categories',
      'mission_types',
      'social_networks',
      'missions',
      'mission_submissions',
      'mission_completions',
      'exchange_requests',
      'referrals',
      'invitation_codes',
      'app_settings',
      'mission_verifications',
      'mission_verifications_pending',
    ]

    const backup: any = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      tables: {},
    }

    for (const table of tables) {
      try {
        const { data, error } = await adminSupabase
          .from(table)
          .select('*')

        if (!error) {
          backup.tables[table] = data || []
        }
      } catch (err) {
        console.log(`[v0] Table ${table} not found or error fetching`)
        backup.tables[table] = []
      }
    }

    // Get statistics
    const { data: stats } = await adminSupabase
      .from('users')
      .select('*', { count: 'exact' })

    backup.statistics = {
      totalUsers: stats?.length || 0,
      backupDate: new Date().toISOString(),
    }

    return NextResponse.json(backup)
  } catch (error: any) {
    console.error('[v0] Error creating backup:', error)
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

    const backupData = await request.json()

    if (!backupData.tables) {
      return NextResponse.json({ error: 'Invalid backup format' }, { status: 400 })
    }

    const adminSupabase = getAdminSupabaseClient()

    // Restore data - WARNING: This will REPLACE all data
    const restoredTables: string[] = []

    for (const [tableName, records] of Object.entries(backupData.tables)) {
      try {
        // Restore data using upsert to handle duplicates safely
        if (Array.isArray(records) && records.length > 0) {
          const { error: upsertError } = await adminSupabase
            .from(tableName as string)
            .upsert(records as any[], { onConflict: 'id' })

          if (!upsertError) {
            restoredTables.push(tableName)
          } else {
            console.error(`[v0] Error upserting into ${tableName}:`, upsertError)
          }
        } else {
          restoredTables.push(tableName)
        }
      } catch (err) {
        console.error(`[v0] Error restoring table ${tableName}:`, err)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Restored ${restoredTables.length} tables`,
      restoredTables,
      restoreDate: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[v0] Error restoring backup:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
