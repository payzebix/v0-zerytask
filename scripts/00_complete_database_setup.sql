-- Complete Database Setup Script for Mission System
-- This script creates all necessary tables with proper relationships and indexes

BEGIN;

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  username TEXT UNIQUE,
  avatar_url TEXT,
  wallet_address TEXT,
  twitter_handle TEXT,
  discord_id TEXT,
  xp_balance INTEGER DEFAULT 0,
  zeryt_balance DECIMAL(20, 2) DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  is_admin BOOLEAN DEFAULT FALSE,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);
CREATE INDEX IF NOT EXISTS users_referral_code_idx ON public.users(referral_code);
CREATE INDEX IF NOT EXISTS users_is_admin_idx ON public.users(is_admin);
CREATE INDEX IF NOT EXISTS users_status_idx ON public.users(status);

-- ============================================
-- 2. ADMIN CONFIGURATION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.admin_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zeryt_exchange_rate DECIMAL(10, 6) NOT NULL DEFAULT 0.05,
  min_withdrawal_amount DECIMAL(20, 2) NOT NULL DEFAULT 20,
  withdrawal_window_days INTEGER DEFAULT 3,
  referral_xp_reward INTEGER DEFAULT 5000,
  referral_zeryt_reward DECIMAL(20, 2) DEFAULT 250,
  referral_usdc_reward DECIMAL(20, 2) DEFAULT 50,
  referral_min_level INTEGER DEFAULT 3,
  referral_min_missions INTEGER DEFAULT 5,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 3. MISSION PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.mission_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  category_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mission_profiles_status_idx ON public.mission_profiles(status);
CREATE INDEX IF NOT EXISTS mission_profiles_created_by_idx ON public.mission_profiles(created_by);

-- ============================================
-- 4. MISSION CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.mission_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  icon_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mission_categories_status_idx ON public.mission_categories(status);
CREATE INDEX IF NOT EXISTS mission_categories_created_by_idx ON public.mission_categories(created_by);

-- Update mission_profiles to reference categories
ALTER TABLE public.mission_profiles
  ADD CONSTRAINT mission_profiles_category_fk 
  FOREIGN KEY (category_id) REFERENCES public.mission_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS mission_profiles_category_id_idx ON public.mission_profiles(category_id);

-- ============================================
-- 5. MISSION TYPES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.mission_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 6. SOCIAL NETWORKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.social_networks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  icon_url VARCHAR(500),
  verification_method VARCHAR(50) DEFAULT 'automatic' CHECK (verification_method IN ('automatic', 'manual')),
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS social_networks_name_idx ON public.social_networks(name);

-- ============================================
-- 7. MISSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  brief TEXT,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  zeryt_reward DECIMAL(20, 2) NOT NULL DEFAULT 0,
  verification_type TEXT DEFAULT 'manual' CHECK (verification_type IN ('social', 'on_chain', 'manual')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'paused', 'archived')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  category TEXT,
  image_url TEXT,
  mission_profile_id UUID REFERENCES public.mission_profiles(id) ON DELETE CASCADE,
  mission_type_id UUID REFERENCES public.mission_types(id) ON DELETE SET NULL,
  social_network_id UUID REFERENCES public.social_networks(id) ON DELETE SET NULL,
  website_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS missions_status_idx ON public.missions(status);
CREATE INDEX IF NOT EXISTS missions_profile_id_idx ON public.missions(mission_profile_id);
CREATE INDEX IF NOT EXISTS missions_type_id_idx ON public.missions(mission_type_id);
CREATE INDEX IF NOT EXISTS missions_priority_idx ON public.missions(priority);

-- ============================================
-- 8. MISSION SUBMISSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.mission_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'verified', 'rejected')),
  submission_proof TEXT,
  completed_at TIMESTAMP,
  verified_at TIMESTAMP,
  verified_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, mission_id)
);

CREATE INDEX IF NOT EXISTS mission_submissions_user_id_idx ON public.mission_submissions(user_id);
CREATE INDEX IF NOT EXISTS mission_submissions_mission_id_idx ON public.mission_submissions(mission_id);
CREATE INDEX IF NOT EXISTS mission_submissions_status_idx ON public.mission_submissions(status);
CREATE INDEX IF NOT EXISTS mission_submissions_verified_by_idx ON public.mission_submissions(verified_by);

-- ============================================
-- 9. MISSION COMPLETIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.mission_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'verified', 'rejected')),
  submission_proof TEXT,
  completed_at TIMESTAMP,
  verified_at TIMESTAMP,
  verified_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, mission_id)
);

CREATE INDEX IF NOT EXISTS mission_completions_user_id_idx ON public.mission_completions(user_id);
CREATE INDEX IF NOT EXISTS mission_completions_mission_id_idx ON public.mission_completions(mission_id);

-- ============================================
-- 10. EXCHANGE REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.exchange_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  zeryt_amount DECIMAL(20, 2) NOT NULL,
  usdc_amount DECIMAL(20, 2) NOT NULL,
  wallet_address TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'cancelled')),
  exchange_rate DECIMAL(10, 6) NOT NULL,
  payment_deadline TIMESTAMP,
  paid_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS exchange_requests_user_id_idx ON public.exchange_requests(user_id);
CREATE INDEX IF NOT EXISTS exchange_requests_status_idx ON public.exchange_requests(status);

-- ============================================
-- 11. REFERRALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referral_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'level_reached', 'missions_completed', 'rewarded')),
  referral_xp_claimed BOOLEAN DEFAULT FALSE,
  referral_zeryt_claimed BOOLEAN DEFAULT FALSE,
  referral_usdc_claimed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(referrer_id, referral_user_id)
);

CREATE INDEX IF NOT EXISTS referrals_referrer_id_idx ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS referrals_referral_user_id_idx ON public.referrals(referral_user_id);

-- ============================================
-- 12. INVITATION CODES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.invitation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  used_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP,
  expires_at TIMESTAMP,
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'revoked')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS invitation_codes_code_idx ON public.invitation_codes(code);
CREATE INDEX IF NOT EXISTS invitation_codes_created_by_idx ON public.invitation_codes(created_by);
CREATE INDEX IF NOT EXISTS invitation_codes_used_by_idx ON public.invitation_codes(used_by);
CREATE INDEX IF NOT EXISTS invitation_codes_status_idx ON public.invitation_codes(status);

-- ============================================
-- 13. INSERT DEFAULT DATA
-- ============================================

-- Insert default admin config if not exists
INSERT INTO public.admin_config (id) 
VALUES (gen_random_uuid()) 
ON CONFLICT DO NOTHING;

-- Insert default mission types
INSERT INTO public.mission_types (name, description) 
VALUES 
  ('Social Media', 'Tasks involving social media platforms'),
  ('On-Chain', 'Blockchain and on-chain verification tasks'),
  ('Manual', 'Tasks requiring manual verification')
ON CONFLICT DO NOTHING;

-- Insert default social networks
INSERT INTO public.social_networks (name, icon_url) 
VALUES 
  ('Twitter', NULL),
  ('Discord', NULL),
  ('Telegram', NULL),
  ('GitHub', NULL)
ON CONFLICT DO NOTHING;

COMMIT;
