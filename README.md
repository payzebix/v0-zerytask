# ZeryT - Web3 Missions Platform

A comprehensive Web3 missions application similar to Galxe.com and Zealy.io, where users complete tasks to earn XP and ZeryT tokens.

## Features

### User Features
- **Email/Password Registration** - Simple signup without email verification
- **User Dashboard** - View missions, XP progress, and ZeryT balance
- **Mission Completion** - Complete various missions (Social, On-chain, Manual) to earn rewards
- **User Profile** - Manage account details, wallet address, X/Twitter handle
- **Exchange System** - Exchange ZeryT to USDC with admin-configurable rates
- **Referral Program** - Earn rewards by referring friends with customizable criteria

### Admin Features
- **Admin Dashboard** - Overview of platform metrics and recent activity
- **Mission Management** - Create, edit, and delete missions with configurable rewards
- **Exchange Management** - Configure ZeryT to USDC exchange rates and minimum withdrawal amounts
- **User Management** - View all users and their statistics
- **Exchange Requests** - Process and mark exchange requests as paid
- **Referral Configuration** - Set referral rewards and requirements
- **Statistics** - Track user growth, active missions, pending exchanges, and economy health

## Technology Stack

- **Frontend**: Next.js 16, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Email/Password)

## Database Schema

### Users Table
- `id` - Primary key
- `user_id` - Supabase auth user ID
- `email` - User email
- `username` - Display username
- `xp` - Experience points
- `zeryt` - ZeryT token balance
- `level` - User level
- `rank` - User rank
- `wallet_address` - Crypto wallet address
- `twitter_handle` - X/Twitter handle
- `avatar_url` - Profile avatar URL
- `referral_code` - Unique referral code
- `referrer_id` - ID of referring user
- `created_at` - Account creation timestamp

### Missions Table
- `id` - Primary key
- `title` - Mission name
- `description` - Mission details
- `category` - Mission type (social, on-chain, manual)
- `xp_reward` - XP earned on completion
- `zeryt_reward` - ZeryT earned on completion
- `verification_method` - How mission is verified
- `active` - Whether mission is active
- `created_at` - Creation timestamp

### Exchange Requests Table
- `id` - Primary key
- `user_id` - User making the request
- `zeryt_amount` - Amount of ZeryT to exchange
- `usdc_amount` - Equivalent USDC amount
- `wallet_address` - Wallet to receive USDC
- `status` - Request status (pending, paid, rejected)
- `created_at` - Request creation timestamp
- `paid_at` - When admin marked as paid

### Referrals Table
- `id` - Primary key
- `referrer_id` - User who referred
- `referred_user_id` - User who was referred
- `status` - Referral status (pending, active, claimed)
- `created_at` - Referral creation timestamp

### Admin Config Table
- `id` - Global config ID
- `zeryt_to_usdc_rate` - Exchange rate
- `min_withdrawal_amount` - Minimum ZeryT to exchange

### Referral Config Table
- `id` - Global config ID
- `xp_reward` - XP per successful referral
- `zeryt_reward` - ZeryT per successful referral
- `usdc_reward` - USDC per successful referral
- `min_level_requirement` - Minimum level to qualify
- `min_missions_requirement` - Minimum missions to complete
- `multiplier` - Reward multiplier

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd zeryt-missions
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup Supabase**
   - Create a Supabase project at supabase.com
   - Run the database migration: `/scripts/init_database.sql`
   - Add Supabase environment variables

4. **Environment Variables**
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - User app: http://localhost:3000
   - Admin access: remgoficial@gmail.com

## API Routes

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users/me` - Get current user profile
- `PATCH /api/users/me/update` - Update user profile

### Missions
- `GET /api/missions` - Get available missions
- `GET /api/admin/missions` - Get all missions (admin)
- `POST /api/admin/missions/create` - Create new mission

### Exchange
- `GET /api/exchange/config` - Get exchange configuration
- `POST /api/exchange/request` - Request exchange
- `GET /api/exchange/request` - Get user's exchange requests
- `GET /api/admin/exchange-requests` - Get all exchange requests
- `POST /api/admin/exchange-config` - Update exchange config
- `POST /api/admin/exchange-requests/[id]/pay` - Mark exchange as paid

### Referrals
- `GET /api/referrals/config` - Get referral configuration
- `GET /api/referrals/my-referrals` - Get user's referrals
- `POST /api/admin/referrals-config` - Update referral config

### Admin
- `GET /api/admin/stats` - Get dashboard statistics
- `GET /api/admin/activity` - Get recent activity
- `GET /api/admin/users` - Get all users

## Key Pages

### User Pages
- `/` - Home/Dashboard
- `/missions` - Browse missions
- `/exchange` - ZeryT to USDC exchange
- `/referrals` - Referral program
- `/profile` - User account management
- `/auth/signup` - Registration
- `/auth/login` - Login

### Admin Pages
- `/admin` - Admin dashboard
- `/admin/missions` - Mission management
- `/admin/missions/create` - Create new mission
- `/admin/requests` - Exchange request management
- `/admin/users` - User management
- `/admin/referrals` - Referral configuration

## Admin Credentials
- **Email**: remgoficial@gmail.com
- Access the app with this email to access admin features

## Mission Categories
- **Social** - Twitter/X tasks, Discord tasks, etc.
- **On-chain** - Blockchain-based tasks
- **Manual** - Tasks requiring manual verification

## Exchange Process
1. User initiates exchange request with minimum amount check
2. Request appears in admin panel as "Pending"
3. Admin marks as "Paid" once transaction is processed
4. User has 1-3 business days to mark complete
5. Exchange is moved to "Paid" status

## Customization

### Change Admin Email
Update in `/app/page.tsx`, `/app/admin/**/*.tsx` files:
```typescript
if (user?.email === 'your-email@example.com') {
  setIsAdmin(true)
}
```

### Adjust Exchange Rate
Navigate to Admin Controls → Exchange Configuration

### Modify Referral Rewards
Navigate to Admin → Referral Configuration

## Deployment

Deploy to Vercel for best Next.js support:
```bash
vercel deploy
```

Set environment variables in Vercel dashboard before deployment.
