import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { referralCode, newEmail } = await request.json();

    if (!referralCode || !newEmail) {
      return NextResponse.json(
        { error: 'Referral code and email are required' },
        { status: 400 }
      );
    }

    // Find the referrer
    const { data: referrer } = await supabase
      .from('waitlist_entries')
      .select('id, position, total_referrals')
      .eq('referral_code', referralCode)
      .single();

    if (!referrer) {
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 404 }
      );
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from('waitlist_entries')
      .select('id')
      .eq('email', newEmail)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        valid: true,
        referrerPosition: referrer.position,
        referrerReferrals: referrer.total_referrals,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get referral stats
export async function GET(request: NextRequest) {
  try {
    const referralCode = request.nextUrl.searchParams.get('code');

    if (!referralCode) {
      return NextResponse.json(
        { error: 'Referral code is required' },
        { status: 400 }
      );
    }

    const { data: entry } = await supabase
      .from('waitlist_entries')
      .select('position, total_referrals, created_at')
      .eq('referral_code', referralCode)
      .single();

    if (!entry) {
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        position: entry.position,
        totalReferrals: entry.total_referrals,
        joinedAt: entry.created_at,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
