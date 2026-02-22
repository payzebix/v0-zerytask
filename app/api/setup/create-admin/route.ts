import { createServerSupabaseClient } from '@/lib/supabase-server'
import { generateInvitationCode } from '@/lib/code-generator'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // Verify setup key is provided (security measure)
    const setupKey = request.headers.get('x-setup-key')
    const defaultSetupKey = 'dev-setup-2024' // Default key for development
    
    // Check if setup key matches (either provided or default for dev)
    if (!setupKey || (setupKey !== process.env.SETUP_KEY && setupKey !== defaultSetupKey)) {
      console.log('[v0] Unauthorized setup attempt:', { setupKey, hasEnvKey: !!process.env.SETUP_KEY })
      return NextResponse.json(
        { error: 'Unauthorized. Please use the correct setup key.' },
        { status: 401 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // Check if an admin invitation code already exists
    const { data: existingCodes, error: checkError } = await supabase
      .from('invitation_codes')
      .select('code')
      .eq('status', 'active')
      .ilike('code', 'ADMIN%')

    if (checkError && checkError.code !== 'PGRST205') {
      console.error('[v0] Error checking for existing codes:', checkError)
      return NextResponse.json(
        { error: 'Database error', details: checkError.message },
        { status: 400 }
      )
    }

    if (existingCodes && existingCodes.length > 0) {
      return NextResponse.json(
        { 
          message: 'Admin invitation code already exists',
          code: existingCodes[0].code,
          note: 'Use this code to register as admin at /auth/signup'
        },
        { status: 200 }
      )
    }

    // Generate a special admin invitation code
    const adminCode = 'ADMIN' + generateInvitationCode().slice(5)

    // Create invitation code for admin (with no created_by since this is system-generated)
    // We'll use a system user ID or leave it null if the schema allows
    const { data: invitationCode, error: codeError } = await supabase
      .from('invitation_codes')
      .insert({
        code: adminCode,
        created_by: null,
        status: 'active',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      })
      .select()
      .single()

    if (codeError) {
      console.error('[v0] Error creating invitation code:', codeError)
      // If null doesn't work for created_by, we might need a system user
      if (codeError.message?.includes('NOT NULL')) {
        return NextResponse.json(
          { 
            error: 'Database constraint error',
            details: 'System user not found. Please ensure database is properly initialized.',
          },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to create invitation code', details: codeError.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        message: 'Admin invitation code created successfully',
        code: invitationCode.code,
        expiresAt: invitationCode.expires_at,
        instructions: 'Go to /auth/signup and use this code to register as admin',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[v0] Setup error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
