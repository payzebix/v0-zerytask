# Quick Start - Security & Architecture Guide

**Read this first.** A 5-minute overview of how to use Supabase clients safely in this project.

---

## The Three Rules

### Rule 1: Use the Right Client for the Right Place

```
Browser Component? → lib/supabase.ts
Server Component / API Route? → lib/supabase-server.ts
Admin Operation (SERVER ONLY)? → lib/supabase-admin.ts
```

### Rule 2: Always Validate IDs

```typescript
import { isValidUUID } from '@/lib/uuid-validator'

if (!isValidUUID(id)) {
  return { error: 'Invalid ID' }
}
// Now safe to use in queries
```

### Rule 3: Always Check Admin Access (for admin operations)

```typescript
import { checkAdminAccess } from '@/lib/admin-check'

if (!await checkAdminAccess()) {
  return { error: 'Forbidden' }
}
// Now safe to use admin client
```

---

## Quick Code Patterns

### Pattern 1: Safe API Route with ID Validation

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { isValidUUID, invalidUUIDResponse } from '@/lib/uuid-validator'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. Validate ID
  if (!isValidUUID(params.id)) {
    const response = invalidUUIDResponse('Resource ID')
    return NextResponse.json(
      { error: response.error },
      { status: response.status }
    )
  }

  // 2. Get server client
  const supabase = await createServerSupabaseClient()

  // 3. Query safely (ID is validated)
  const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}
```

### Pattern 2: Admin Operation

```typescript
import { checkAdminAccess } from '@/lib/admin-check'
import { getAdminSupabaseClient } from '@/lib/supabase-admin'
import { isValidUUID, invalidUUIDResponse } from '@/lib/uuid-validator'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. Validate ID
  if (!isValidUUID(params.id)) {
    const response = invalidUUIDResponse('Resource ID')
    return NextResponse.json(
      { error: response.error },
      { status: response.status }
    )
  }

  // 2. Check admin access
  if (!await checkAdminAccess()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 3. Use admin client (safe - user is verified admin)
  const admin = getAdminSupabaseClient()
  const { data, error } = await admin
    .from('table_name')
    .update({ status: 'active' })
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}
```

### Pattern 3: Client Component (Real-time)

```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function MyComponent() {
  const [data, setData] = useState(null)
  const supabase = createClient()

  useEffect(() => {
    // Queries are protected by RLS - user can only see their data
    supabase
      .from('my_table')
      .select('*')
      .on('*', (payload) => {
        console.log('Change received!', payload)
        setData(payload.new)
      })
      .subscribe()
  }, [])

  return <div>{/* ... */}</div>
}
```

---

## Environment Variables Checklist

**Before deploying, verify in Vercel project settings:**

```
✅ NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
✅ SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (SECRET - not visible in preview)
```

**In preview environment:**
- ✅ Can see NEXT_PUBLIC_* variables
- ✅ Cannot see SUPABASE_SERVICE_ROLE_KEY (correct!)

If you see "Your project's URL and Key are required" error:
1. Check Vercel Settings > Environment Variables
2. Verify all three are present
3. Click "Deploy" to redeploy

---

## Common Mistakes & Fixes

### ❌ Mistake 1: Using service role in client code

```typescript
// ❌ WRONG - Service role key will leak to browser
import { createClient } from '@supabase/supabase-js'
const client = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY)
```

**Fix:**
```typescript
// ✅ RIGHT - Use browser client for client-side
import { createClient } from '@/lib/supabase'
const client = createClient()

// ✅ RIGHT - Use admin client only in server code (API routes, Server Actions)
import { getAdminSupabaseClient } from '@/lib/supabase-admin'
const admin = getAdminSupabaseClient() // Server-side only
```

### ❌ Mistake 2: Querying without UUID validation

```typescript
// ❌ WRONG - What if userId is undefined?
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
```

**Fix:**
```typescript
// ✅ RIGHT - Always validate first
import { isValidUUID } from '@/lib/uuid-validator'

if (!isValidUUID(userId)) {
  throw new Error('Invalid user ID')
}

const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
```

### ❌ Mistake 3: Trusting frontend for admin status

```typescript
// ❌ WRONG - Frontend says "I'm admin", but we don't verify
export async function POST(request) {
  const { isAdmin } = await request.json()
  if (isAdmin) {
    // User can spoof this!
    await adminClient.from('missions').delete()
  }
}
```

**Fix:**
```typescript
// ✅ RIGHT - Verify on server every time
import { checkAdminAccess } from '@/lib/admin-check'

export async function POST(request) {
  if (!await checkAdminAccess()) {
    return { error: 'Forbidden' }
  }
  // Now we know user is admin
  const admin = getAdminSupabaseClient()
  await admin.from('missions').delete()
}
```

### ❌ Mistake 4: Race conditions with undefined IDs

```typescript
// ❌ WRONG - profileId might not be ready
const { user } = useAuth()
const { data: missions } = useSWR(
  `/api/missions/profile/${user.profileId}`, // Could be undefined!
  fetcher
)
```

**Fix:**
```typescript
// ✅ RIGHT - Only fetch when ID is ready
const { user } = useAuth()
const { data: missions } = useSWR(
  user?.profileId ? `/api/missions/profile/${user.profileId}` : null,
  fetcher
)
```

---

## File Reference

| File | Purpose | Use When |
|------|---------|----------|
| `lib/supabase.ts` | Browser client | Client components, real-time data |
| `lib/supabase-server.ts` | Server client | Server Components, API routes |
| `lib/supabase-admin.ts` | Admin client | Admin operations ONLY |
| `lib/uuid-validator.ts` | UUID validation | Before any database query |
| `lib/admin-check.ts` | Admin verification | Before any admin operation |

---

## Documentation Files

| File | Read When |
|------|-----------|
| `QUICK_START_SECURITY.md` | You're new to the project (this file) |
| `SUPABASE_ARCHITECTURE.md` | You need detailed architecture info |
| `SECURITY_CHECKLIST.md` | You're verifying the security implementation |
| `IMPLEMENTATION_SUMMARY.md` | You want complete implementation details |

---

## 5-Minute Security Test

After deploying, test these to verify everything works:

```bash
# 1. Can you login? ✅
# 2. Can you view missions? ✅
# 3. As admin, can you toggle a mission? ✅
# 4. As non-admin, does toggle fail? ✅ (should get 403)
# 5. Do invalid IDs return 400? ✅
#    curl https://yoursite/api/missions/invalid-id
```

---

## When in Doubt

1. **Is this client-side code?** → Use `lib/supabase.ts`
2. **Is this server-side code?** → Use `lib/supabase-server.ts`
3. **Is this admin operation?** → Use `lib/supabase-admin.ts` (after `checkAdminAccess()`)
4. **Do you have an ID from user input?** → Validate with `isValidUUID()`
5. **Still unsure?** → Read `SUPABASE_ARCHITECTURE.md`

---

**Questions? Check the documentation files or contact the team.**
