import { createServerClient } from '@supabase/ssr'
import { getAdminSupabaseClient } from '@/lib/supabase-admin'
import { isValidUUID, invalidUUIDResponse } from '@/lib/uuid-validator'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Validate mission ID is a valid UUID
    if (!isValidUUID(id)) {
      const response = invalidUUIDResponse('Mission ID')
      return NextResponse.json(
        { error: response.error },
        { status: response.status }
      )
    }

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
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.email !== 'remgoficial@gmail.com') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { status } = body

    if (!status || !['active', 'draft', 'paused', 'archived'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      )
    }

    const adminSupabase = getAdminSupabaseClient()
    const { data: mission, error } = await adminSupabase
      .from('missions')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[v0] Toggle mission error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!mission) {
      return NextResponse.json(
        { error: 'Mission not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(mission)
  } catch (error: any) {
    console.error('[v0] Toggle mission catch error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
