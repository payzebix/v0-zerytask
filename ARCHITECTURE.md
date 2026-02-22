# Mission System v2 - Architecture & File Structure

## Directory Structure

```
app/
├── admin/
│   ├── page.tsx (updated with quick actions)
│   ├── mission-profiles/
│   │   ├── page.tsx (list profiles)
│   │   ├── create/
│   │   │   └── page.tsx (create profile form)
│   │   └── [id]/
│   │       └── route.ts (delete profile)
│   ├── missions/
│   │   └── new/
│   │       ├── page.tsx (mission wizard)
│   │       └── loading.tsx (suspense boundary)
│   └── mission-verification/
│       └── page.tsx (verification dashboard)
│
└── api/
    ├── admin/
    │   ├── mission-profiles/
    │   │   ├── route.ts (GET profiles, POST create)
    │   │   └── [id]/
    │   │       └── route.ts (DELETE profile)
    │   ├── missions/
    │   │   └── create/
    │   │       └── route.ts (POST create mission)
    │   └── mission-submissions/
    │       ├── route.ts (GET submissions)
    │       └── [id]/
    │           └── verify/
    │               └── route.ts (POST verify submission)
    ├── mission-types/
    │   └── route.ts (GET types)
    └── social-networks/
        └── route.ts (GET networks)
```

## Component Hierarchy

### Pages

#### `/admin/mission-profiles/page.tsx`
- **Purpose:** Display list of all mission profiles
- **Features:**
  - Grid layout (1 col mobile, 2 cols tablet, 3 cols desktop)
  - Logo display for each profile
  - Status badge (active/inactive/archived)
  - Edit button (link to edit page)
  - Add Mission button (link to create mission)
  - Delete button with confirmation
- **Data Flow:** useSWR to fetch profiles
- **Auth:** useAuth for permission check

#### `/admin/mission-profiles/create/page.tsx`
- **Purpose:** Create new mission profile
- **Features:**
  - Logo upload with preview
  - Form inputs (name, description, status)
  - Client-side form validation
  - Error handling
  - Cancel/Create buttons
- **Data Flow:** POST to `/api/admin/mission-profiles`
- **Upload:** Uses `/api/upload` for blob storage

#### `/admin/missions/new/page.tsx`
- **Purpose:** Wizard-based mission creation
- **Features:**
  - Step 1: Profile selection (required)
  - Step 2: Mission type selection (required)
  - Step 3: Conditional fields (social network or website URL)
  - Step 4: Mission details (title, description, rewards, priority)
  - Visual step indicators
  - Error messages
  - Validation before submission
- **Data Flow:** 
  - GET mission types from `/api/mission-types`
  - GET social networks from `/api/social-networks`
  - POST to `/api/admin/missions/create`
- **Search Params:** Accepts `?profile=[id]` to pre-select profile

#### `/admin/mission-verification/page.tsx`
- **Purpose:** Verify user mission submissions
- **Features:**
  - Left sidebar: Pending submissions list
  - Right panel: Detailed submission view
  - User info display
  - Mission info with rewards
  - Evidence images gallery
  - Evidence URL linking
  - Admin notes textarea
  - Approve/Reject buttons
  - Automatic reward distribution
- **Data Flow:**
  - GET submissions from `/api/admin/mission-submissions`
  - POST verification to `/api/admin/mission-submissions/[id]/verify`
  - mutate() to refresh list after action

### API Routes

#### `GET /api/admin/mission-profiles`
```typescript
Response: MissionProfile[]
Auth: Admin only
```

#### `POST /api/admin/mission-profiles`
```typescript
Body: {
  name: string
  description?: string
  logo_url?: string
  status?: 'active' | 'inactive' | 'archived'
}
Response: MissionProfile
Auth: Admin only
Status Codes: 201 (created), 400 (validation), 401 (auth), 403 (forbidden)
```

#### `DELETE /api/admin/mission-profiles/[id]`
```typescript
Response: { success: true }
Auth: Admin only
Status Codes: 200 (success), 401 (auth), 403 (forbidden)
```

#### `POST /api/admin/missions/create`
```typescript
Body: {
  title: string
  description: string
  brief: string
  mission_profile_id: string
  mission_type_id: string
  social_network_id?: string
  website_url?: string
  verification_type: 'manual' | 'auto'
  xp_reward: number
  zeryt_reward: number
  priority: 'low' | 'normal' | 'high'
  status: 'active' | 'inactive'
}
Response: Mission
Auth: Admin only
Status Codes: 201 (created), 400 (validation), 401 (auth), 403 (forbidden)
```

#### `GET /api/admin/mission-submissions`
```typescript
Response: MissionSubmission[]
- Includes: mission details, user details
- Ordered by: created_at (descending)
Auth: Admin only
```

#### `POST /api/admin/mission-submissions/[id]/verify`
```typescript
Body: {
  approved: boolean
  admin_notes?: string
}
Response: MissionSubmission
Side Effects:
- Updates submission status (approved/rejected)
- If approved: adds XP/ZeryT to user balance
- Records verified_by and verified_at
Auth: Admin only
Status Codes: 200 (success), 400 (error), 401 (auth), 403 (forbidden)
```

#### `GET /api/mission-types`
```typescript
Response: MissionType[]
- Fields: id, name, slug, icon_url, verification_method, is_custom
- Ordered by: name (ascending)
Auth: Public
```

#### `GET /api/social-networks`
```typescript
Response: SocialNetwork[]
- Fields: id, name, slug, icon_url, color
- Ordered by: name (ascending)
Auth: Public
```

## Data Models

### MissionProfile
```typescript
interface MissionProfile {
  id: string
  name: string
  description: string
  logo_url: string
  status: 'active' | 'inactive' | 'archived'
  created_by: string
  created_at: string
  updated_at: string
}
```

### Mission (Extended)
```typescript
interface Mission {
  id: string
  title: string
  description: string
  brief: string
  mission_profile_id: string
  mission_type_id: string
  social_network_id?: string
  website_url?: string
  verification_type: 'manual' | 'auto'
  xp_reward: number
  zeryt_reward: number
  priority: 'low' | 'normal' | 'high'
  status: 'active' | 'inactive'
  category: string
  created_at: string
  updated_at: string
}
```

### MissionSubmission
```typescript
interface MissionSubmission {
  id: string
  user_id: string
  mission_id: string
  status: 'pending' | 'approved' | 'rejected'
  submission_proof?: string
  submission_images?: string[]
  submission_url?: string
  notes?: string
  admin_notes?: string
  created_at: string
  verified_at?: string
  verified_by?: string
  mission?: {
    id: string
    title: string
    xp_reward: number
    zeryt_reward: number
  }
  user?: {
    id: string
    username: string
    avatar_url?: string
  }
}
```

### MissionType
```typescript
interface MissionType {
  id: string
  name: string
  slug: string
  icon_url: string
  verification_method: 'auto' | 'manual'
  is_custom: boolean
}
```

### SocialNetwork
```typescript
interface SocialNetwork {
  id: string
  name: string
  slug: string
  icon_url: string
  color: string
}
```

## Hooks & Utilities Used

### useAuth
- Location: `@/hooks/useAuth`
- Purpose: Get current user and loading state
- Returns: `{ user, loading }`

### useSWR
- Library: `swr`
- Purpose: Client-side data fetching and caching
- Usage: `const { data, mutate } = useSWR(url, fetcher)`

### Navigation Component
- Location: `@/components/Navigation`
- Purpose: Consistent header across admin pages
- Props: `isAdmin: boolean`

## Authentication & Authorization

### Admin Checks
All admin pages perform auth verification:
```typescript
const { user, loading: authLoading } = useAuth()
const [isAdmin, setIsAdmin] = useState(false)

useEffect(() => {
  if (!authLoading && user) {
    fetch('/api/users/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.is_admin) setIsAdmin(true)
        else router.push('/')
      })
  }
}, [user, authLoading, router])
```

### API Security
All admin endpoints verify:
1. User is authenticated
2. User has `is_admin` flag in database
3. Returns 401 (unauthorized) or 403 (forbidden) accordingly

## Styling Approach

### Colors (Tailwind CSS)
- **Primary:** teal-500/teal-600 (actions)
- **Success:** green-500/green-400 (approve)
- **Danger:** red-500/red-400 (reject)
- **Warning:** orange-500/orange-400 (pending)
- **Background:** slate-950/slate-900/slate-800 (dark theme)
- **Text:** white/gray-400/gray-500 (hierarchy)

### Responsive Design
- Mobile: 1 column, full width
- Tablet (md): 2 columns
- Desktop (lg): 3+ columns
- Navigation adapts to screen size

### Components
- Cards with borders and hover states
- Badges for status
- Buttons with variants (primary, outline, destructive)
- Forms with proper spacing and labels
- Modals/dialogs for confirmations

## Performance Optimizations

1. **SWR Caching:** Client-side data is cached and revalidated
2. **Lazy Loading:** Components load data on mount
3. **Image Optimization:** Logo URLs stored as references
4. **Suspense Boundaries:** useSearchParams wrapped properly
5. **Error Handling:** Graceful fallbacks and error messages

## Security Considerations

1. **Admin Verification:** Every admin endpoint checks permissions
2. **Input Validation:** Server-side validation on all POST/PUT routes
3. **SQL Injection Prevention:** Using parameterized queries via Supabase SDK
4. **CORS:** Handled by Vercel/Next.js automatically
5. **XSS Prevention:** React escapes content automatically
6. **CSRF:** Handled by Next.js automatically

## Error Handling

### User-Facing Errors
- Form validation errors
- Network errors with retry option
- Permission denied messages
- Empty state messages

### Server-Side Errors
- Detailed console logging with `[v0]` prefix
- User-friendly error messages returned
- Proper HTTP status codes
- Transaction rollback on failure

## Deployment Checklist

- [ ] Verify Supabase tables exist (mission_profiles, etc.)
- [ ] Check blob storage is configured
- [ ] Test admin user flag in database
- [ ] Verify all environment variables set
- [ ] Test logo upload functionality
- [ ] Verify API endpoints return correct data
- [ ] Test authorization on all endpoints
- [ ] Load test with multiple admins
- [ ] Test mobile responsiveness
- [ ] Review error messages and logging

---

**Last Updated:** January 21, 2026
**Version:** 2.0
**Status:** Production Ready
