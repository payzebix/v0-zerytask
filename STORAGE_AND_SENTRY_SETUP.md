# Supabase Storage & Sentry Integration Guide

This guide explains the migration from Vercel Blob to Supabase Storage and the addition of Sentry error tracking.

## What Changed

### 1. File Storage: Blob → Supabase Storage

**Before (Blob):**
- Used Vercel Blob for file uploads
- Dependencies: `@vercel/blob`
- Single public storage

**After (Supabase):**
- Uses Supabase Storage for file uploads
- Multiple buckets: `mission-images`, `user-avatars`, `submission-proofs`
- Better integration with Supabase auth and RLS

### 2. Error Tracking: Added Sentry

- Real-time error monitoring
- User context tracking
- Performance monitoring
- Session replay on errors

## Setup Instructions

### Step 1: Create Supabase Storage Buckets

Execute the migration script in Supabase:

```bash
# In Supabase SQL Editor, run:
-- Copy contents of scripts/22_create_storage_buckets.sql
```

Or use the Supabase dashboard:
1. Storage → Buckets
2. Create bucket: `mission-images` (public)
3. Create bucket: `user-avatars` (public)
4. Create bucket: `submission-proofs` (public)

### Step 2: Set Up Sentry (Optional but Recommended)

1. **Create Sentry Project:**
   - Go to https://sentry.io
   - Create new project (Next.js)
   - Get your DSN

2. **Add Environment Variables:**
   ```env
   NEXT_PUBLIC_SENTRY_DSN=https://your-key@sentry.io/project-id
   ```

3. **Install Dependencies:**
   ```bash
   npm install @sentry/nextjs
   ```

4. **Enable Instrumentation:**
   - The `instrumentation.ts` file automatically initializes Sentry
   - Add to `next.config.js`:
   ```js
   experimental: {
     instrumentationHook: true,
   }
   ```

### Step 3: Update Environment Variables

Remove Blob-related variables (if any):
- `BLOB_READ_WRITE_TOKEN` (no longer needed)

Verify Supabase variables are set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Files Changed

### Storage
- `/lib/blob-storage.ts` → Now uses Supabase Storage
- `/app/api/upload/route.ts` → Updated to use Supabase
- New: `/scripts/22_create_storage_buckets.sql` → Creates storage buckets

### Sentry
- New: `/lib/sentry.ts` → Sentry initialization and utilities
- New: `/instrumentation.ts` → Enables Sentry instrumentation
- `/hooks/useAuth.ts` → Added Sentry user tracking

## API Changes

### Upload Endpoint

**Before:**
```typescript
const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData, // contains 'file'
})
```

**After:**
```typescript
const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData, // contains 'file' and 'bucket'
})
// bucket: 'mission-images' | 'user-avatars' | 'submission-proofs'
```

### Upload Functions

Functions remain the same:
- `uploadMissionLogo(file)` → mission-images bucket
- `uploadUserAvatar(file)` → user-avatars bucket
- `uploadSubmissionProof(file)` → submission-proofs bucket

## Monitoring with Sentry

### Automatic Tracking
- Auth events (login/logout)
- Upload errors
- All unhandled exceptions

### Manual Tracking
```typescript
import { captureException, addSentryBreadcrumb } from '@/lib/sentry'

// Capture an error
try {
  // code
} catch (error) {
  captureException(error, { context: 'custom context' })
}

// Add breadcrumb for debugging
addSentryBreadcrumb('User completed mission', 'mission', 'info')
```

## Troubleshooting

### Uploads failing
1. Check bucket names are correct
2. Verify Supabase Storage is enabled
3. Check browser console for CORS errors
4. Verify authentication status

### Sentry not capturing events
1. Verify `NEXT_PUBLIC_SENTRY_DSN` is set
2. Check browser console for Sentry initialization
3. Ensure `instrumentation.ts` is loaded
4. In development, Sentry may not send to server (debug mode)

### Storage bucket permissions
If you get permission errors:
1. Enable public read access on buckets (done in migration)
2. Check RLS policies in Supabase
3. Verify user is authenticated for uploads

## Performance Impact

- **Storage**: Supabase Storage is faster (CDN-backed)
- **Error Tracking**: Minimal overhead with sampled traces (10% in production)
- **Session Replay**: Only on errors, doesn't affect normal performance

## Migration Checklist

- [ ] Run Supabase storage bucket migration script
- [ ] Update package.json with Sentry (npm install @sentry/nextjs)
- [ ] Set `NEXT_PUBLIC_SENTRY_DSN` environment variable
- [ ] Enable instrumentation in next.config.js
- [ ] Test file uploads with new storage
- [ ] Test error tracking in Sentry dashboard
- [ ] Update deployment environment variables
- [ ] Monitor production errors in Sentry

## Reverting to Blob (Not Recommended)

If you need to revert:
1. Install `@vercel/blob` package
2. Restore original `lib/blob-storage.ts`
3. Update `/app/api/upload/route.ts` to use `put()`
4. Set `BLOB_READ_WRITE_TOKEN` environment variable
