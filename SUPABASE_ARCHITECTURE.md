# Supabase Client Architecture

This document outlines the three types of Supabase clients used in this project and when to use each one.

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  BROWSER CLIENT (supabase.ts)                                   │
│  - Key: NEXT_PUBLIC_SUPABASE_ANON_KEY (public, safe)           │
│  - Respects RLS policies ✅                                      │
│  - Use in: Client components, browser-only logic                │
│  - Security: User can only access their own data (enforced)     │
│                                                                  │
│  SERVER CLIENT (supabase-server.ts)                             │
│  - Key: NEXT_PUBLIC_SUPABASE_ANON_KEY (same as browser)        │
│  - Respects RLS policies ✅                                      │
│  - Use in: Server Actions, API routes, Server Components       │
│  - Difference: Has auth context, can refresh user session       │
│                                                                  │
│  ADMIN CLIENT (supabase-admin.ts)                               │
│  - Key: SUPABASE_SERVICE_ROLE_KEY (private, never expose)      │
│  - Bypasses RLS ⚠️ (POWERFUL AND DANGEROUS)                     │
│  - Use in: Admin operations ONLY (server-side)                  │
│  - MUST validate user permissions before using                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## The Three Client Types

### 1. Browser Client (`lib/supabase.ts`)

**When to use:**
- Client components that need real-time data
- User-facing features where users can only access their own data
- Public queries (e.g., list of active missions)

**Key characteristic:**
- Runs in the browser
- Enforces RLS policies (user can only access their own data)
- Safe to expose

```typescript
// ✅ OK: Client Component
'use client'
import { createClient } from '@/lib/supabase'

export default function UserProfile() {
  const supabase = createClient()
  // User can only read/write their own profile
  const { data } = await supabase.from('users').select('*').eq('id', userId)
}
```

### 2. Server Client (`lib/supabase-server.ts`)

**When to use:**
- API route handlers
- Server Actions
- Server Components that need to fetch data
- Any server-side logic that needs the user's session

**Key characteristic:**
- Runs on the server
- Enforces RLS policies (user can only access their own data)
- Has authentication context for the current user
- Can refresh user sessions

```typescript
// ✅ OK: Server Component or API Route
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  // Queries are constrained to the authenticated user
  const { data } = await supabase.from('missions').select('*')
}
```

### 3. Admin Client (`lib/supabase-admin.ts`)

**When to use:**
- Admin operations that need to bypass RLS
- Bulk updates, administrative actions
- Operations that should never be user-facing

**KEY SECURITY RULES:**
- ❌ NEVER use in client components
- ❌ NEVER expose the service_role key
- ✅ ALWAYS validate admin access first
- ✅ ALWAYS validate UUIDs before database operations

```typescript
// ✅ OK: API Route Handler (with admin check)
import { checkAdminAccess } from '@/lib/admin-check'
import { getAdminSupabaseClient } from '@/lib/supabase-admin'
import { isValidUUID } from '@/lib/uuid-validator'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  // Step 1: Check admin access
  if (!await checkAdminAccess()) {
    return new Response('Forbidden', { status: 403 })
  }

  // Step 2: Validate UUID
  if (!isValidUUID(params.id)) {
    return new Response('Invalid ID', { status: 400 })
  }

  // Step 3: Use admin client for the operation
  const admin = getAdminSupabaseClient()
  const { data } = await admin.from('missions').update({ status: 'active' }).eq('id', params.id)
}
```

## Security Best Practices

### 1. Always Validate UUIDs
```typescript
import { isValidUUID } from '@/lib/uuid-validator'

// ❌ BAD: No validation
.eq('id', userId)

// ✅ GOOD: Always validate first
if (!isValidUUID(userId)) {
  throw new Error('Invalid UUID')
}
.eq('id', userId)
```

### 2. Always Check Admin Access
```typescript
// ❌ BAD: Trusting frontend to not send data
export async function POST(req: Request) {
  const { isAdmin } = await req.json() // ❌ Can be spoofed!
  if (isAdmin) { /* ... */ }
}

// ✅ GOOD: Server-side admin verification
import { checkAdminAccess } from '@/lib/admin-check'

export async function POST(req: Request) {
  if (!await checkAdminAccess()) {
    return new Response('Forbidden', { status: 403 })
  }
  // Now safe to use admin client
}
```

### 3. Handle Environment Variables Properly
```typescript
// ❌ BAD: Missing validation
createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!)

// ✅ GOOD: Validate before using
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
}
createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
```

## Environment Variables Reference

### Required (Public - Safe to commit)
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon key (public, cannot modify data behind RLS)

### Required (Secret - Never commit)
- `SUPABASE_SERVICE_ROLE_KEY` - Admin key (bypasses RLS, extremely sensitive)

### Optional
- Other environment variables for different integrations

**Never:**
- ❌ Commit `SUPABASE_SERVICE_ROLE_KEY` to Git
- ❌ Expose service role key in client code
- ❌ Use service role key without admin verification
- ❌ Query database without validating IDs

## Troubleshooting

### Error: "Your project's URL and Key are required"
This happens when environment variables are missing. Check:
1. `.env.local` file in the project root
2. Vercel project Settings > Environment Variables
3. Both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set

### Error: "Invalid API key"
This usually means:
1. Service role key is being used in client code (❌ wrong)
2. Wrong key for the operation (browser client can't modify RLS-protected data)
3. Key has expired (regenerate in Supabase dashboard)

### Error: "UUID undefined"
This is caused by:
1. Race condition - UUID not ready when query executes
2. Missing validation - UUID was never validated
3. Wrong parameter name (check if `id` vs `userId` vs `profileId`)

**Fix:** Always validate before querying:
```typescript
if (!isValidUUID(userId)) {
  return null // or throw error
}
// Only now safe to query
.eq('id', userId)
```

## Architecture Decision Log

### Why three clients and not just one?
- **Browser Client**: Needed for real-time features and client-side state
- **Server Client**: Provides auth context on the server (needed for session refresh)
- **Admin Client**: Bypasses RLS for legitimate admin operations without exposing service key

### Why strict UUID validation?
- Prevents SQL injection attacks
- Prevents querying with undefined/null IDs
- Protects against race conditions
- Makes debugging easier

### Why checkAdminAccess middleware?
- Centralizes admin permission checking
- Prevents repeated DB queries for the same check
- Reduces the chance of accidentally allowing non-admin operations
