import { createServerSupabaseClient } from '@/lib/supabase-server'
import { captureException, addSentryBreadcrumb } from '@/lib/sentry'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('[v0] Upload API called')
    
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('[v0] Auth error:', userError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const bucket = (formData.get('bucket') as string) || 'mission-images'

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

    // Validate bucket
    const validBuckets = ['mission-images', 'user-avatars', 'submission-proofs']
    if (!validBuckets.includes(bucket)) {
      return NextResponse.json(
        { error: 'Invalid bucket' },
        { status: 400 }
      )
    }

    // Create unique filename to prevent overwrites
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 9)
    const uniqueFilename = `${timestamp}-${randomStr}-${user.id}.${fileExtension}`

    // Convert file to buffer for upload
    const buffer = await file.arrayBuffer()
    
    console.log('[v0] Uploading to bucket:', bucket, 'filename:', uniqueFilename)
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(uniqueFilename, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('[v0] Supabase upload error:', error.message)
      return NextResponse.json(
        { error: `Upload failed: ${error.message}` },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    console.log('[v0] Image uploaded successfully:', publicUrl)
    addSentryBreadcrumb('Image uploaded successfully', 'upload', 'info', { bucket, filename: uniqueFilename })

    return NextResponse.json(
      { 
        url: publicUrl,
        filename: file.name,
        size: file.size,
        type: file.type,
        path: data.path,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Upload error:', error)
    captureException(error, { 
      context: 'file upload',
      userId: 'unknown',
      bucket,
      filename: file?.name
    })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
