# Error Diagnostics and Fixes for v0-zerytask

## Current Issue: RLS Infinite Recursion

**Error:** `infinite recursion detected in policy for relation "users"`

**Root Cause:** The RLS policies on the users table were trying to query the users table to check admin status, creating infinite recursion.

**Status:** FIXED - RLS policies were updated to use JWT authentication (`auth.jwt() ->> 'is_admin' = 'true'`) instead of SELECT queries.

---

## Logging Added for Debugging

### Browser Console Logs (Client-Side)

The following pages now log to the browser console for debugging:

1. **HomePage** (`/app/page.tsx`)
   - Logs user auth status, profile fetch, and mission profiles
   - Format: `[v0] HomePage loaded, user: UUID, authLoading: boolean`

2. **MissionsPage** (`/app/missions/page.tsx`)
   - Logs page load, auth effects, and profile fetch
   - Format: `[v0] MissionsPage - profilesData: count, error: error`

3. **AdminMissionsPage** (`/app/admin/missions/page.tsx`)
   - Logs admin auth checks and data fetching
   - Format: `[v0] AdminMissionsPage loaded, user: UUID`

4. **MissionVerificationPage** (`/app/admin/mission-verification/page.tsx`)
   - Logs verification data fetching and status updates
   - Format: `[v0] Pending verifications count: number`

### Server-Side Logs

All API routes now log detailed information:

1. **GET /api/users/me**
   - Logs user profile fetch, creation, and errors
   - Detects and handles RLS recursion errors

2. **GET /api/admin/missions**
   - Logs admin check and mission fetch
   - Includes error codes for debugging

3. **GET /api/admin/mission-verifications**
   - Logs verification fetch with detailed error info
   - Tracks admin access checks

---

## How to Debug Using Console Logs

### 1. Open Browser DevTools
- **Chrome/Edge:** Press `F12` or `Ctrl+Shift+I`
- **Firefox:** Press `F12` or `Ctrl+Shift+I`
- **Safari:** Press `Cmd+Option+I`

### 2. Go to Console Tab
Look for messages with `[v0]` prefix

### 3. Check Log Flow

**Expected flow for missions page:**
```
[v0] MissionsPage loaded, user: ca1ccb72-...
[v0] MissionsPage effect - user: ca1ccb72-...
[v0] MissionsPage - profilesData: 5, error: undefined
```

**If you see errors:**
- `infinite recursion detected` → RLS policy issue
- `Unauthorized` → Auth issue
- `Failed to fetch profiles` → API issue with logging details

### 4. Network Tab
- Go to **Network** tab
- Look for failed API calls
- Click on requests to see response body
- Look for error messages

---

## Known Issues and Fixes

### 1. Admin Mission Verification Page Crashing
**Error:** `Uncaught ReferenceError: pendingSubmissions is not defined`

**Fixed:** Changed variable name from `pendingSubmissions` to `pendingVerifications` on line 160

**Status:** FIXED ✅

### 2. RLS Infinite Recursion on Users Table
**Error:** `infinite recursion detected in policy for relation "users"`

**Fixed:** Updated all RLS policies to use JWT authentication instead of SELECT queries

**Status:** FIXED ✅

### 3. Missions Not Saving/Appearing in Production
**Possible Causes:**
1. RLS policies blocking writes (FIXED)
2. Missing INSERT permissions (need RLS UPDATE)
3. API not logging errors properly (FIXED)

**Diagnostics:**
- Check browser console for API errors
- Check Supabase logs in dashboard
- Verify RLS policies were applied correctly

---

## Verification Checklist

After deployment, verify:

- [ ] Browser console shows no `[v0]` errors
- [ ] HomePage loads without errors
- [ ] Admin can access /admin/missions
- [ ] Admin verification page loads (/admin/mission-verification)
- [ ] Missions display on /missions page
- [ ] Admin can create new missions
- [ ] Mission verifications can be approved/rejected
- [ ] New missions appear after creation

---

## SQL Queries to Run in Supabase

### Check RLS Policies
```sql
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename IN ('missions', 'users', 'mission_profiles', 'mission_submissions')
ORDER BY tablename, policyname;
```

### Verify RLS is Enabled
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Check Infinite Recursion
Run any admin query and check Supabase logs for "infinite recursion" errors.

---

## Next Steps if Issues Persist

1. **Enable Query Logging:**
   - Supabase Dashboard → Logs → choose a request
   - Look for error details

2. **Check Auth Context:**
   - Verify auth tokens are valid
   - Check session storage

3. **Verify Database Connection:**
   - Test with simple SELECT query
   - Check network latency to Supabase

4. **Check Environment Variables:**
   - Verify NEXT_PUBLIC_SUPABASE_URL
   - Verify SUPABASE_SERVICE_ROLE_KEY (server-side only)
