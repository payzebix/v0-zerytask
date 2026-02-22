import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('[v0] Social networks POST started')
    
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Handle cookie setting errors
            }
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.log('[v0] No user')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!userData?.is_admin) {
      console.log('[v0] User is not admin')
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    console.log('[v0] Admin verified, using service role')
    
    const { createServiceRoleClient } = await import('@/lib/supabase-service-role')
    const serviceRoleClient = createServiceRoleClient()

    const body = await request.json()
    const { name, icon_url, verification_method } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const { data, error } = await serviceRoleClient
      .from('social_networks')
      .insert([
        {
          name,
          icon_url: icon_url || '',
          verification_method: verification_method || 'automatic',
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('[v0] Error creating social network:', error.message, 'Code:', error.code)
      return NextResponse.json(
        { error: error.message || 'Error creating network', code: error.code },
        { status: 500 }
      )
    }

    console.log('[v0] Social network created:', data?.id)
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('[v0] Social networks POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
