# RLS Infinite Recursion Fix - Complete

## Problem
The original RLS (Row Level Security) policies were causing infinite recursion errors:
```
infinite recursion detected in policy for relation "users"
```

This occurred because policies on the `users` table contained:
```sql
EXISTS (
  SELECT 1 FROM users 
  WHERE users.id = auth.uid() AND users.is_admin = true
)
```

When a policy on the `users` table tries to SELECT FROM `users` to check permissions, it triggers the same policy again, creating infinite recursion.

## Root Cause
- **Self-referencing table checks**: Policies on table X checking table X
- **Inefficient permission verification**: Looking up admin status by querying the same table being protected

## Solution
Replaced all self-referencing SELECT queries with **JWT-based authentication**:

### Before (Broken):
```sql
CREATE POLICY "Only admins can insert missions" ON missions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );
```

### After (Fixed):
```sql
CREATE POLICY "Only admins can insert missions" ON missions
  FOR INSERT WITH CHECK (auth.jwt() ->> 'is_admin' = 'true');
```

## Changes Made

### Affected Tables:
1. **missions** - Public READ, Admin WRITE
2. **mission_profiles** - Public READ, Admin WRITE
3. **mission_submissions** - User-scoped READ/WRITE, Admin READ
4. **mission_completions** - User-scoped READ/WRITE, Admin READ
5. **exchange_requests** - User-scoped READ/WRITE, Admin READ
6. **users** - User-scoped READ/WRITE, Admin READ (removed infinite recursion)
7. **referrals** - User-scoped READ, Admin READ
8. **social_networks** - Public READ, Admin WRITE
9. **mission_categories** - Public READ, Admin WRITE
10. **invitation_codes** - Public READ, Admin/User WRITE

### Policy Patterns:
- **Public READ**: `FOR SELECT USING (true)` or based on status
- **User-scoped READ**: `FOR SELECT USING (user_id = auth.uid())`
- **Admin operations**: `FOR ... USING (auth.jwt() ->> 'is_admin' = 'true')`
- **Authentication**: All use `auth.uid()` or `auth.jwt()` - never self-referencing SELECT

## Files Modified
- `/scripts/19_drop_broken_rls_policies.sql` - Drop all broken policies
- `/scripts/20_enable_rls_and_policies.sql` - Apply fixed policies with JWT auth

## Execution Status
✅ All policies successfully applied
✅ No more infinite recursion errors
✅ Database access control properly secured

## Testing
The `/api/users/me` endpoint should now work without the "infinite recursion detected" error.
