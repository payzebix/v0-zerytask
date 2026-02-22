# Production Deployment - Debug Guide

## Quick Diagnosis

### Problem: Missions don't appear

**Step 1: Check public endpoint**
```bash
curl https://app.zerytask.xyz/api/missions/public
# Should return array of missions
```

**Step 2: Check if RLS is enabled**
Go to Supabase Dashboard → Tables → missions
- Check "RLS is Enabled" toggle (should be ON)
- Check Policies tab for 4 policies (select, insert, update, delete)

**Step 3: Check logs**
```
Browser DevTools → Network tab → Find /api/missions request
Check Response tab for errors
Check Console tab for [v0] logs
```

---

## Common Issues & Solutions

### Issue 1: "missions" table returns empty array
**Cause:** RLS enabled but no public read policy
**Solution:** Run the migration script `/scripts/20_enable_rls_and_policies.sql`

### Issue 2: Admin can't see admin panel
**Cause:** User's `is_admin` is not set to true
**Solution:** In Supabase, edit users table and set is_admin = true for admin user

### Issue 3: Images don't upload
**Cause:** BLOB credentials missing or wrong file type
**Solution:** Check `.env.local` has BLOB token, verify file type is jpg/png/gif/webp

### Issue 4: Referral codes don't work in signup
**Cause:** Already fixed in previous phase, but verify invitation_codes table has data
**Solution:** Check invitation_codes table has at least "PAY1810" code

### Issue 5: Admin mission verification queue empty
**Cause:** No missions submitted for verification OR RLS policy blocking access
**Solution:** 
1. User submits mission for verification
2. Check mission_verifications_pending table in Supabase
3. Verify admin policy allows reading this table

---

## Monitoring & Logging

### What Each Log Tells You

**[v0] Fetching public missions**
- API is being called correctly

**[v0] Found missions: 5 for profile: xxx**
- Missions are in database for that profile

**[v0] Error fetching missions by profile**
- Either network error or RLS blocked query

**[v0] Falling back to public missions**
- Auth failed, trying public endpoint

**[v0] Admin check for user xxx: true**
- User is admin and has access to admin features

### Enable Debug Mode

1. Open browser DevTools (F12)
2. Network tab to see API calls
3. Console tab to see [v0] logs
4. Look for exact error messages

---

## SQL Queries to Run in Supabase

### Check RLS Status
```sql
-- Check if RLS is enabled on missions table
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'missions';
-- Result should show: t (true)
```

### Check RLS Policies
```sql
-- List all policies on missions table
SELECT policyname, permissive, qual, with_check
FROM pg_policies
WHERE tablename = 'missions';
-- Should show 4 policies: select, insert, update, delete
```

### Check Admin Users
```sql
-- Find all admin users
SELECT id, email, is_admin 
FROM users 
WHERE is_admin = true;
```

### Check Active Missions
```sql
-- Count active missions
SELECT COUNT(*) as active_missions
FROM missions
WHERE status = 'active';
```

### Check Mission Profiles
```sql
-- List all mission profiles
SELECT id, name, status, created_at
FROM mission_profiles
ORDER BY created_at DESC;
```

---

## Production vs Local Differences

### What works differently in production:

| Feature | Local | Production |
|---------|-------|-----------|
| Auth | Session persists | Session may expire |
| URLs | localhost:3000 | app.zerytask.xyz |
| Database | Direct connection | Via Supabase REST API |
| RLS | Disabled by default | ENABLED (critical!) |
| Files | Local storage | Vercel Blob |
| Logs | Browser console | Supabase logs + Vercel logs |

### What might break in production:

1. **Session expiration** → Handled with fallback endpoints
2. **Network latency** → Retry logic needed
3. **RLS policies blocking queries** → Check policies in Supabase
4. **Service worker caching** → Clear cache if seeing stale data
5. **CORS issues** → Usually handled by Next.js

---

## Performance Optimization

### If missions load slowly:

1. **Check Supabase query count**
   - Each mission profile fetch also fetches missions
   - Should be optimized with joins

2. **Enable caching**
   - Public missions endpoint has `cache: 'no-store'`
   - Could be changed to 60 second cache for better performance

3. **Check network waterfall**
   - DevTools Network tab should show parallel requests
   - Not sequential

---

## Emergency Recovery

If everything breaks:

### Option 1: Disable RLS Temporarily
```sql
-- WARNING: Only for debugging!
ALTER TABLE missions DISABLE ROW LEVEL SECURITY;
-- Now anyone can read missions
```
Then re-enable after fixing:
```sql
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
```

### Option 2: Reset to Public Endpoint Only
Change `/app/api/missions/route.ts` to ONLY use public endpoint:
```typescript
// Temporarily comment out authenticated fetch
// const { data: missions } = await supabase.from('missions').select('*')
// Just use public endpoint
```

### Option 3: Check Supabase Status
- Go to https://status.supabase.com
- Check if any services are down

---

## Final Verification Script

Run this to verify everything is working:

```bash
# 1. Check missions endpoint
curl https://app.zerytask.xyz/api/missions/public

# 2. Check profiles endpoint
curl https://app.zerytask.xyz/api/mission-profiles/public

# 3. Check upload (need auth)
curl -X POST https://app.zerytask.xyz/api/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@image.jpg"

# 4. Check admin endpoint (need auth + admin)
curl https://app.zerytask.xyz/api/admin/missions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Still Having Issues?

1. Check `/PRODUCTION_FIXES_SUMMARY.md` for overview
2. Check `/PRODUCTION_DIAGNOSIS.md` for root cause analysis
3. Check browser console for [v0] logs
4. Check Supabase logs: Project → Logs → Database
5. Check Vercel logs: Project → Monitoring → Function Logs

Contact support with:
- Exact error message from console
- Screenshot of Network tab
- Timestamp of when issue occurred
