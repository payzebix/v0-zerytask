# 🚀 Zerytask - Setup Guide

## Quick Start: 5-Minute Setup

### Step 1: Verify Environment Variables

Ensure your Supabase environment variables are set in Vercel:

1. Go to your Vercel Project > Settings > Environment Variables
2. Verify these variables exist:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY` - Service role key (secret)

**Important:** Service role key should be marked as secret and only available in production/server.

### Step 2: Deploy to Vercel

```bash
git push origin main
# OR click "Deploy" in Vercel dashboard
```

Wait for deployment to complete.

### Step 3: Access Setup Page

1. Open your app URL in browser
2. Navigate to `/setup` (e.g., `https://yourapp.vercel.app/setup`)
3. You should see the "System Setup" form

### Step 4: Create Database Tables

1. Enter setup key: `dev-setup-2024` (default)
2. Click **"Step 1: Create Database Tables"**
3. If you see a message about manual setup needed:
   - Go to Supabase Dashboard > SQL Editor
   - Run the migrations from `/scripts` folder:
     - First: `00_complete_database_setup.sql`
     - Then: `13_make_created_by_nullable.sql`
   - Come back and retry step 1

### Step 5: Execute Migrations

1. Click **"Step 2: Execute All Migrations"**
2. Wait for success message

### Step 6: Generate Admin Code

1. Click **"Step 3: Generate Admin Code"**
2. Copy the code that appears (starts with `ADMIN`)
3. Share this code with your admin

### Step 7: Disable Maintenance Mode

1. Click **"Step 4: Disable Maintenance Mode"**
2. App is now ready!

### Step 8: Register Admin

1. Go to `/auth/signup`
2. Paste the admin code
3. Complete registration with admin email and password

---

## Troubleshooting

### Error: "Your project's URL and Key are required"

**Cause:** Environment variables not set.

**Fix:**
1. Check Vercel project settings > Environment Variables
2. Ensure all three variables are present
3. Redeploy the project
4. Wait 2-3 minutes for build to complete

### Error: "Unauthorized. Please use the correct setup key"

**Cause:** Wrong setup key entered.

**Fix:** Use default key `dev-setup-2024` or set `SETUP_KEY` environment variable.

### Error: "Database tables need to be created manually"

**Cause:** Supabase database not initialized.

**Fix:**
1. Go to Supabase Dashboard > SQL Editor
2. Run `/scripts/00_complete_database_setup.sql`
3. Run `/scripts/13_make_created_by_nullable.sql`
4. Return to `/setup` and retry

### Error: "Database constraint error - System user not found"

**Cause:** Database not properly initialized.

**Fix:**
1. Ensure all migration scripts have been executed
2. Check Supabase dashboard for any errors
3. Contact Zerytask support

---

## Architecture: How Setup Works

```
┌─────────────────────────────────────────────────────────────┐
│ Browser: /setup page (no auth required)                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ├─ POST /api/setup/create-tables
                     │  └─ Verifies database tables exist
                     │
                     ├─ POST /api/setup/execute-migrations
                     │  └─ Runs additional setup queries
                     │
                     ├─ POST /api/setup/create-admin
                     │  └─ Generates admin invitation code
                     │
                     └─ PUT /api/admin/maintenance
                        └─ Disables maintenance mode

All setup endpoints use SUPABASE_SERVICE_ROLE_KEY
Setup routes are EXCLUDED from auth middleware
```

### Why Setup Routes Are Special

- **Excluded from auth middleware** - They don't require a logged-in user
- **Use service_role key** - Can bypass RLS for initialization
- **Protected by setup key** - Only authorized with correct setup key
- **One-time operations** - Designed for first-time setup only

---

## Environment Variables Reference

| Variable | Required | Example | Notes |
|----------|----------|---------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | `https://xxx.supabase.co` | Public key, visible in browser |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | `eyJ...` | Anon key for client-side |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Yes | `eyJ...` | Secret key for server-side, keep hidden |
| `SETUP_KEY` | ❌ Optional | `my-secure-key` | Custom setup key, defaults to `dev-setup-2024` |
| `SENTRY_DSN` | ❌ Optional | `https://xxx@xxx.ingest.sentry.io/xxx` | Error tracking (optional) |

---

## After Setup: Next Steps

1. **Create admin account** - Use the admin code to register
2. **Configure profiles** - Set up user profiles and missions
3. **Deploy to production** - Ensure all env vars are set for production
4. **Monitor logs** - Check Vercel logs for any errors

---

## Setup Checklist

- [ ] Environment variables verified in Vercel
- [ ] Project deployed to Vercel
- [ ] `/setup` page loads without errors
- [ ] Database tables created successfully
- [ ] Migrations executed successfully
- [ ] Admin invitation code generated
- [ ] Admin code shared with admin user
- [ ] Maintenance mode disabled
- [ ] Admin user registered at `/auth/signup`
- [ ] Admin can access `/admin` dashboard
- [ ] App ready for users!

---

## Need Help?

- Check `/setup` page for detailed error messages
- Review `SECURITY_CHECKLIST.md` for best practices
- Check Vercel deployment logs
- Verify Supabase database status
- Review `/scripts` folder for SQL details

