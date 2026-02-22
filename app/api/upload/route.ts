import { put } from '@vercel/blob'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('[v0] Auth error:', userError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const path = formData.get('path') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size (5MB max)
    const MAX_FILE_SIZE = 5 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large (max 5MB)' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' },
        { status: 400 }
      )
    }

    // Create unique filename to prevent overwrites
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const basePath = path || `uploads/${user.id}`
    const uniqueFilename = `${basePath}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExtension}`

    // Convert file to buffer for upload
    const buffer = await file.arrayBuffer()
    
    // Upload to Vercel Blob
    const blob = await put(uniqueFilename, buffer, {
      access: 'public',
      contentType: file.type,
    })

    console.log('[v0] Image uploaded successfully:', blob.url)

    return NextResponse.json(
      { 
        url: blob.url,
        filename: file.name,
        size: file.size,
        type: file.type,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
