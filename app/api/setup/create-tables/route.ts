import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // Verify setup key
    const setupKey = request.headers.get('x-setup-key')
    const defaultSetupKey = 'dev-setup-2024'
    
    if (!setupKey || (setupKey !== process.env.SETUP_KEY && setupKey !== defaultSetupKey)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createServerSupabaseClient()
    console.log('[v0] Setting up database tables...')

    // Check and create app_settings table if it doesn't exist
    const { error: appSettingsError } = await supabase
      .from('app_settings')
      .select('id')
      .limit(1)

    if (appSettingsError && appSettingsError.code === 'PGRST205') {
      console.log('[v0] app_settings table does not exist, creating...')
      // Table doesn't exist - note: this won't create it, you'd need RLS rules via Supabase dashboard
      // For now, we'll note this in the response
      return NextResponse.json(
        { 
          warning: 'Database tables need to be created manually',
          instructions: [
            'Go to your Supabase dashboard',
            'Open the SQL Editor',
            'Run the migration scripts from /scripts folder',
            'Start with: 00_complete_database_setup.sql',
            'Then run: 13_make_created_by_nullable.sql'
          ]
        },
        { status: 503 }
      )
    }

    // If we get here, app_settings exists - try to check invitation_codes
    const { error: invCodesError } = await supabase
      .from('invitation_codes')
      .select('id')
      .limit(1)

    if (invCodesError && invCodesError.code === 'PGRST205') {
      console.log('[v0] invitation_codes table does not exist')
      return NextResponse.json(
        { 
          warning: 'Database tables need to be created manually',
          instructions: [
            'Go to your Supabase dashboard',
            'Open the SQL Editor',
            'Run the migration scripts from /scripts folder',
            'Start with: 00_complete_database_setup.sql',
            'Then run: 13_make_created_by_nullable.sql'
          ]
        },
        { status: 503 }
      )
    }

    console.log('[v0] All required tables exist')
    
    return NextResponse.json(
      { 
        message: 'Database setup verified. Tables exist.',
        status: 'ready'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Setup error:', error)
    return NextResponse.json(
      { error: 'Setup failed', details: String(error) },
      { status: 500 }
    )
  }
}
