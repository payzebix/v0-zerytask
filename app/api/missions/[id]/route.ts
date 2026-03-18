import { createServerSupabaseClient } from '@/lib/supabase-server'
import { isValidUUID, invalidUUIDResponse } from '@/lib/uuid-validator'
import { NextResponse, NextRequest } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await params - Next.js 16 requirement
    const { id } = await params

    // Validate mission ID is a valid UUID
    if (!isValidUUID(id)) {
      const response = invalidUUIDResponse('Mission ID')
      return NextResponse.json(
        { error: response.error },
        { status: response.status }
      )
    }

    const supabase = await createServerSupabaseClient()

    // Fetch mission
    const { data: mission, error: missionError } = await supabase
      .from('missions')
      .select('*')
      .eq('id', id)
      .single()

    if (missionError || !mission) {
      console.error('[v0] Mission fetch error:', missionError)
      return NextResponse.json(
        { error: 'Mission not found' },
        { status: 404 }
      )
    }

    // Fetch social network icon if mission has a social_network_id
    let socialNetworkIcon = mission.image_url
    if (mission.social_network_id) {
      const { data: socialNetwork } = await supabase
        .from('social_networks')
        .select('icon_url, name')
        .eq('id', mission.social_network_id)
        .single()

      if (socialNetwork?.icon_url) {
        socialNetworkIcon = socialNetwork.icon_url
      }
    }

    // Return mission with enhanced data
    return NextResponse.json({
      ...mission,
      image_url: socialNetworkIcon || mission.image_url,
      sub_missions: [],
    })
  } catch (error) {
    console.error('[v0] Mission detail error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
