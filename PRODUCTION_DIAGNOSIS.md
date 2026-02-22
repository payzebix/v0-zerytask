# Production Deployment Issues - Complete Diagnosis

## Critical Issues Found

### 1. **RLS (Row Level Security) Disabled on All Mission Tables** ❌
**Impact:** HIGHEST - Data visibility not controlled

**Current State:**
- `missions` table: RLS **DISABLED** → Anyone can read ALL missions without auth
- `mission_profiles` table: RLS **DISABLED** → Anyone can access without restrictions
- `mission_submissions` table: RLS **DISABLED** → Anyone can read all submissions
- `mission_verifications_pending` table: RLS **ENABLED** but has issues with INSERT/UPDATE policies
- Most other tables: RLS **DISABLED**

**Problem:** When RLS is disabled, Supabase REST API requires EXPLICIT authentication checks in the code. Without proper RLS policies OR server-side validation, data may be silently rejected or not properly scoped.

**Why missions don't appear:**
1. API returns 401 if user auth fails
2. User auth might be invalid/expired on production
3. No fallback for public missions

### 2. **Mission API Requires Auth But No Public Fallback** 
**File:** `/app/api/missions/route.ts`

Current code:
```typescript
const { data: { user }, error: authError } = await supabase.auth.getUser()
if (authError || !user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

**Problem:** If user session is expired, ALL missions fail to load. Should have fallback.

### 3. **Admin Check Might Be Failing**
**File:** `/lib/admin-check.ts`

Need to verify admin check logic handles production correctly.

### 4. **Blob Storage Not Verified**
Need to check if image uploads are actually working and URLs are accessible.

## Solutions Required

### Phase 1: Add Public Mission Endpoint (Critical)
Create new endpoint `/app/api/missions/public` that:
- Requires NO authentication
- Returns only missions with `status = 'active'`
- Used as fallback if auth fails

### Phase 2: Enable RLS and Create Policies (Important)
For each table, enable RLS and add policies:

**missions:**
- SELECT: Anyone can read active missions
- INSERT/UPDATE/DELETE: Only admins

**mission_profiles:**
- SELECT: Anyone can read active profiles
- INSERT/UPDATE/DELETE: Only admins

**mission_submissions:**
- SELECT: Users see their own, admins see all
- INSERT: Authenticated users only
- UPDATE/DELETE: Only admins

**users:**
- SELECT: Users see their own data, admins see all
- UPDATE: Users update their own data only

### Phase 3: Fix API Error Handling
- Add retry logic with exponential backoff
- Implement proper error logging
- Add fallbacks for expired sessions

### Phase 4: Verify Blob Storage
- Check BLOB URLs are public and accessible
- Ensure upload endpoint is working

## Implementation Priority

1. **CRITICAL:** Create public missions endpoint + fix auth fallback
2. **HIGH:** Enable RLS and create policies
3. **MEDIUM:** Fix error handling in all APIs
4. **LOW:** Add monitoring and logging
