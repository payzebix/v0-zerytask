import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Generate a unique referral code
function generateReferralCode(): string {
  return `ZERY-${nanoid(6).toUpperCase()}`;
}

export async function POST(request: NextRequest) {
  try {
    const { twitterHandle, email, referredBy } = await request.json();

    // Validate input
    if (!twitterHandle || !email) {
      return NextResponse.json(
        { error: 'Twitter handle and email are required' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from('waitlist_entries')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Get current max position
    const { data: maxPosition } = await supabase
      .from('waitlist_entries')
      .select('position')
      .order('position', { ascending: false })
      .limit(1)
      .single();

    const nextPosition = (maxPosition?.position || 0) + 1;
    const referralCode = generateReferralCode();

    // Insert new entry
    const { data, error } = await supabase
      .from('waitlist_entries')
      .insert([
        {
          twitter_handle: twitterHandle,
          email,
          referral_code: referralCode,
          position: nextPosition,
          referred_by: referredBy || null,
          total_referrals: 0,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create waitlist entry' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        position: data.position,
        referralCode: data.referral_code,
        inviteLink: `${process.env.NEXT_PUBLIC_APP_URL}/invite/${data.referral_code}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
