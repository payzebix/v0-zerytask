import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
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

    const { data: types, error } = await supabase
      .from('mission_types')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('[v0] Mission types error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Transform types to ensure they have required fields
    const transformedTypes = (types || []).map((type: any) => ({
      id: type.id,
      name: type.name,
      slug: type.slug || type.name.toLowerCase().replace(/\s+/g, '_'),
      icon_url: type.icon_url || '',
      verification_method: type.verification_method || 'manual',
      is_custom: type.is_custom || false,
      description: type.description || '',
    }))

    return NextResponse.json(transformedTypes)
  } catch (error: any) {
    console.error('[v0] Mission types catch error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
