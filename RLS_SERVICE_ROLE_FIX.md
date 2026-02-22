# RLS Policy Fix - Service Role Implementation

## Problem
Admin users couldn't create missions, categories, or social networks because RLS policies checked `auth.jwt() ->> 'is_admin' = 'true'` but the JWT token doesn't include the `is_admin` claim (it only exists in the users table).

All admin INSERT operations failed with: **"new row violates row-level security policy"**

## Solution
Use the Supabase **service role key** for admin API operations. The service role key bypasses RLS policies, allowing admins to create/update data after verification.

## Changes Made

### 1. Created Service Role Helper (`/lib/supabase-service-role.ts`)
- `createServiceRoleClient()` - Creates a client with service role key
- `verifyAdminAccessAndGetClient()` - Verifies admin status and returns service role client

### 2. Updated Admin APIs to Use Service Role
All admin POST/PUT operations now:
1. Check if user is authenticated
2. Verify user is admin by querying users table
3. Create service role client to bypass RLS
4. Perform the INSERT/UPDATE operation

#### Updated APIs:
- `/app/api/admin/missions/route.ts` - POST to create missions
- `/app/api/admin/mission-categories/route.ts` - POST to create categories
- `/app/api/admin/social-networks/route.ts` - POST to create social networks

### 3. Fixed URL Routing Issue
- `/app/admin/mission-profiles/page.tsx` - Removed `/edit` suffix from profile edit link (was causing 404)
  - Changed: `/admin/mission-profiles/${id}/edit` → `/admin/mission-profiles/${id}`

### 4. Added Enhanced Error Logging
All admin APIs now log:
- Admin verification steps
- Service role client creation
- Error codes and messages for debugging

## Why This Works

**RLS Policies** check user permissions at the row level but can't verify `is_admin` from JWT.

**Service Role Key** is a special Supabase credential that:
- Bypasses all RLS policies
- Should only be used server-side
- Is already verified to be admin before using it

**Flow:**
```
1. Admin user makes request
2. API verifies user is authenticated
3. API queries users table to check is_admin
4. If admin=true, API uses service role client
5. Service role client bypasses RLS
6. Data is inserted successfully
```

## Testing
Try these URLs to verify fixes:
1. `/admin/missions/create` - Create missions (no RLS error)
2. `/admin/mission-categories` - Create categories (no RLS error)
3. `/admin/mission-profiles/[id]` - Edit profile (no 404 error)
4. `/admin/social-networks` - Create networks (no UUID error)

All should work without RLS violations.
