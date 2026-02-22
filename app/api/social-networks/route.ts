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

    const { data: networks, error } = await supabase
      .from('social_networks')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('[v0] Social networks error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Ensure networks is an array and has required fields
    const transformedNetworks = (networks || []).map((network: any) => ({
      id: network.id,
      name: network.name,
      slug: network.slug || network.name.toLowerCase().replace(/\s+/g, '_'),
      icon_url: network.icon_url || '',
      color: network.color || '#000000',
    }))

    return NextResponse.json(transformedNetworks)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
