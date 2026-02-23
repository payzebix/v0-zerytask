import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

/**
 * Upload file to Supabase Storage
 * @param file - File to upload
 * @param bucket - Bucket name (mission-images, user-avatars, submission-proofs)
 * @returns URL of uploaded file
 */
export async function uploadToSupabaseStorage(
  file: File,
  bucket: 'mission-images' | 'user-avatars' | 'submission-proofs' = 'mission-images'
): Promise<string> {
  try {
    const supabase = createClientComponentClient()
    
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(7)
    const filename = `${timestamp}-${randomStr}-${file.name}`

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('[v0] Supabase Storage upload error:', error)
      throw error
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    console.log('[v0] File uploaded to Supabase Storage:', publicUrl)
    return publicUrl
  } catch (error) {
    console.error('[v0] Storage upload error:', error)
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Upload mission logo
 */
export async function uploadMissionLogo(file: File): Promise<string> {
  return uploadToSupabaseStorage(file, 'mission-images')
}

/**
 * Upload user avatar
 */
export async function uploadUserAvatar(file: File): Promise<string> {
  return uploadToSupabaseStorage(file, 'user-avatars')
}

/**
 * Upload submission proof image
 */
export async function uploadSubmissionProof(file: File): Promise<string> {
  return uploadToSupabaseStorage(file, 'submission-proofs')
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): {
  valid: boolean
  error?: string
} {
  const MAX_SIZE = 5 * 1024 * 1024 // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: `File size must be less than 5MB (current: ${(file.size / 1024 / 1024).toFixed(2)}MB)`,
    }
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type must be one of: ${ALLOWED_TYPES.join(', ')}`,
    }
  }

  return { valid: true }
}
