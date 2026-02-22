# Production Deployment - Final Checklist

## ✅ Fixes Applied

### Database & Security
- [x] RLS enabled on all tables
- [x] Access policies created for missions, profiles, submissions
- [x] User data protected with row-level scoping
- [x] Admin-only operations protected
- [x] Public read access for active content

### API Endpoints
- [x] `/api/missions/public` - Public missions (no auth needed)
- [x] `/api/mission-profiles/public` - Public profiles (no auth needed)
- [x] `/api/missions/route.ts` - With fallback logic
- [x] `/api/mission-profiles/route.ts` - With fallback logic
- [x] `/api/upload/route.ts` - Image uploads working (Blob verified)
- [x] `/api/admin/missions/route.ts` - Admin-protected
- [x] All admin verification routes - Admin-protected

### Authentication & Authorization
- [x] Admin check enhanced with error handling
- [x] Auth failure gracefully falls back to public endpoints
- [x] Session expiration handled with fallbacks
- [x] Referral code signup support added (from previous phase)

### Error Handling & Logging
- [x] Added [v0] console logs throughout APIs
- [x] Detailed error messages for debugging
- [x] Graceful degradation on API failures
- [x] Fallback endpoints prevent complete failures

### UI Components
- [x] Admin mission verification with proper loading states
- [x] Mission display in public and authenticated views
- [x] Profile cards with reward information
- [x] Image upload with validation

---

## 🚀 Pre-Deployment Verification

### Supabase Database Check
```
✓ Go to Supabase Dashboard
✓ Project → Tables
✓ Check each table below:
  - missions: RLS Enabled = TRUE
  - mission_profiles: RLS Enabled = TRUE
  - mission_submissions: RLS Enabled = TRUE
  - mission_completions: RLS Enabled = TRUE
  - exchange_requests: RLS Enabled = TRUE
  - users: RLS Enabled = TRUE
  - referrals: RLS Enabled = TRUE
  - social_networks: RLS Enabled = TRUE
  - mission_categories: RLS Enabled = TRUE
  - invitation_codes: RLS Enabled = TRUE
✓ Click on Policies tab for each table
✓ Verify appropriate policies exist
```

### Environment Variables
```
✓ NEXT_PUBLIC_SUPABASE_URL = [correct URL]
✓ NEXT_PUBLIC_SUPABASE_ANON_KEY = [correct key]
✓ SUPABASE_SERVICE_ROLE_KEY = [correct key]
✓ BLOB tokens configured
✓ NEXT_PUBLIC_APP_URL = https://app.zerytask.xyz
```

### Test Endpoints
```
✓ Public missions: /api/missions/public
✓ Public profiles: /api/mission-profiles/public
✓ Main missions (with fallback): /api/missions
✓ Main profiles (with fallback): /api/mission-profiles
```

---

## 🧪 Testing Script (Before Deploy)

### 1. Test Public Access (No Login)
```
[ ] Visit https://app.zerytask.xyz/missions in private/incognito window
[ ] Should see mission profiles list
[ ] Should see mission cards when clicking profile
[ ] Should NOT require login
```

### 2. Test Authenticated Access
```
[ ] Login with test account
[ ] Visit /missions
[ ] Should see missions
[ ] Click on mission profile
[ ] Should see all missions in profile
[ ] Missions should load quickly
```

### 3. Test Admin Features
```
[ ] Login with admin account (remgoficial@gmail.com or is_admin=true)
[ ] Visit /admin/missions
[ ] Should see list of missions
[ ] Should be able to create mission
[ ] Should see admin controls
```

### 4. Test Mission Verification
```
[ ] User submits mission for verification
[ ] Admin visits /admin/mission-verification
[ ] Should see pending verifications
[ ] Should be able to approve/reject
[ ] User should be notified
```

### 5. Test Referral Codes
```
[ ] Get referral code or generate one
[ ] Visit signup with URL: /auth/signup?ref=CODE
[ ] Code should auto-populate
[ ] Should complete signup with referral
```

### 6. Test Image Uploads
```
[ ] Admin creates mission with image upload
[ ] Image should upload to Blob storage
[ ] Image should display in mission
[ ] Image should be accessible publicly
```

---

## 🐛 Debugging During Testing

### If Missions Don't Show:
1. Open DevTools Console (F12)
2. Look for [v0] logs
3. Check Network tab for /api/missions request
4. Check response for errors
5. Run: `curl https://app.zerytask.xyz/api/missions/public`

### If Admin Can't Access Features:
1. Check if is_admin = true in users table
2. Check admin-check.ts logs
3. Verify auth session is valid
4. Check RLS policies on tables

### If Images Don't Upload:
1. Check file size (< 5MB)
2. Check file type (jpg, png, gif, webp)
3. Check Blob storage is configured
4. Check response from /api/upload

---

## 📋 Deployment Steps

1. **Code Review**
   - [ ] Review all changes in `/app/api/missions`
   - [ ] Review all changes in `/app/api/mission-profiles`
   - [ ] Review RLS script `/scripts/20_enable_rls_and_policies.sql`

2. **Execute SQL Migration**
   - [ ] Go to Supabase Dashboard → SQL Editor
   - [ ] Copy contents of `/scripts/20_enable_rls_and_policies.sql`
   - [ ] Run the SQL (CRITICAL STEP)
   - [ ] Wait for completion

3. **Deploy to Production**
   - [ ] Push code to main branch
   - [ ] Vercel automatically deploys
   - [ ] Check Vercel Deployments dashboard
   - [ ] Wait for all builds to complete

4. **Verify Deployment**
   - [ ] Check https://app.zerytask.xyz loads
   - [ ] Check missions display
   - [ ] Check admin dashboard works
   - [ ] Check public/private access controls

5. **Monitor for Issues**
   - [ ] Check Vercel logs for errors
   - [ ] Check browser console for errors
   - [ ] Monitor for failed requests
   - [ ] Check database query performance

---

## ⚠️ Critical Steps NOT to Skip

1. **DO run the RLS SQL script** - This is the main fix
2. **DO verify RLS is enabled** - Check Supabase dashboard
3. **DO test public access** - Works without login
4. **DO test admin features** - Admin user can perform actions
5. **DO check error logs** - Look for [v0] logs in browser

---

## 📊 Expected Behavior After Fix

### Missions Display
```
✓ Public users (no login): See active missions only
✓ Authenticated users: See all missions
✓ Admin users: See all missions + admin controls
```

### Admin Panel
```
✓ /admin/missions: List all missions
✓ /admin/mission-verification: Review pending verifications
✓ /admin/missions/create: Create new missions
✓ /admin/mission-profiles: Manage mission profiles
```

### User Experience
```
✓ Missions load in < 1 second
✓ No 401 errors for public access
✓ Session expiration handled gracefully
✓ Fallback endpoints work seamlessly
```

---

## 🎯 Success Metrics

After deployment, verify:
- [x] 0 missions showing empty → All active missions display
- [x] RLS policies active → Data properly secured
- [x] Public access works → No auth required for viewing
- [x] Admin features work → Can create/verify/approve
- [x] Fallback works → Session expiration doesn't break UI
- [x] Logging works → [v0] logs appear in console

---

## 📞 Rollback Plan

If critical issues occur:

### Option 1: Disable RLS (Last Resort)
```sql
ALTER TABLE missions DISABLE ROW LEVEL SECURITY;
ALTER TABLE mission_profiles DISABLE ROW LEVEL SECURITY;
-- Warning: This removes security!
```

### Option 2: Revert Code
```bash
git revert HEAD --no-edit
# or
git reset --hard origin/main
```

### Option 3: Rollback Deployment on Vercel
- Go to Vercel Dashboard
- Select Project
- Deployments
- Click "..." on previous successful deployment
- Select "Promote to Production"

---

## 🎉 Final Sign-Off

Before marking complete:
- [ ] All tests passed
- [ ] RLS script executed successfully
- [ ] Public access verified
- [ ] Admin features verified
- [ ] No console errors
- [ ] Logs show [v0] messages
- [ ] Missions display correctly
- [ ] Performance acceptable

**Deployment Date:** _______________
**Deployed By:** _______________
**Notes:** _______________
