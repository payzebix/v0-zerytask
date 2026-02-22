import { put } from '@vercel/blob'

/**
 * Upload file to Vercel Blob storage
 * @param file - File to upload
 * @param prefix - Folder prefix (e.g., 'missions', 'avatars')
 * @returns URL of uploaded file
 */
export async function uploadToBlob(
  file: File,
  prefix: string = 'uploads'
): Promise<string> {
  try {
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(7)
    const filename = `${prefix}/${timestamp}-${randomStr}-${file.name}`

    const response = await put(filename, file, {
      access: 'public',
      addRandomSuffix: false,
    })

    console.log('[v0] File uploaded to Blob:', response.url)
    return response.url
  } catch (error) {
    console.error('[v0] Blob upload error:', error)
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Upload mission logo
 */
export async function uploadMissionLogo(file: File): Promise<string> {
  return uploadToBlob(file, 'missions/logos')
}

/**
 * Upload user avatar
 */
export async function uploadUserAvatar(file: File): Promise<string> {
  return uploadToBlob(file, 'users/avatars')
}

/**
 * Upload submission proof image
 */
export async function uploadSubmissionProof(file: File): Promise<string> {
  return uploadToBlob(file, 'submissions/proofs')
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
