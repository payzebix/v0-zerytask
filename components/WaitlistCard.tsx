'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

type WaitlistStep = 'follow' | 'details' | 'success';

interface WaitlistEntry {
  position: number;
  referralCode: string;
  inviteLink: string;
}

export function WaitlistCard() {
  const [step, setStep] = useState<WaitlistStep>('follow');
  const [twitterHandle, setTwitterHandle] = useState('');
  const [email, setEmail] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [position, setPosition] = useState<number | null>(null);
  const [inviteLink, setInviteLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [referrals, setReferrals] = useState(0);

  const handleFollowClick = () => {
    setStep('details');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/waitlist/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          twitterHandle: twitterHandle.replace('@', ''),
          email,
          referredBy: new URLSearchParams(window.location.search).get('ref'),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to join waitlist');
      }

      const data: WaitlistEntry = await response.json();
      setReferralCode(data.referralCode);
      setPosition(data.position);
      setInviteLink(data.inviteLink);
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="w-full max-w-md">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative"
      >
        {/* Glassmorphism background */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-3xl blur-2xl opacity-60" />

        <div className="relative bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-slate-700/50 rounded-3xl p-8 backdrop-blur-xl">
          {/* Step indicator */}
          {step !== 'success' && (
            <div className="mb-8">
              <div className="flex gap-2 justify-between mb-4">
                <motion.div
                  className={`flex-1 h-1 rounded-full transition-all ${
                    step === 'follow' || step === 'details'
                      ? 'bg-cyan-500'
                      : 'bg-slate-700'
                  }`}
                />
                <motion.div
                  className={`flex-1 h-1 rounded-full transition-all ${
                    step === 'details'
                      ? 'bg-cyan-500'
                      : 'bg-slate-700'
                  }`}
                />
              </div>
              <p className="text-xs text-slate-400">
                Step {step === 'follow' ? 1 : 2} of 2
              </p>
            </div>
          )}

          {/* Step 1: Follow */}
          {step === 'follow' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-2xl font-bold text-white mb-2">
                Join the Community
              </h3>
              <p className="text-slate-400 mb-8">
                Follow @ZeryTask on X to stay updated and unlock early access
              </p>

              <a
                href="https://x.com/ZeryTask"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full block"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75 2.25 7-7 7-7z" />
                  </svg>
                  Follow @ZeryTask
                </motion.button>
              </a>

              <p className="text-center text-slate-500 my-6">or</p>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleFollowClick}
                className="w-full bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 text-white font-semibold py-3 rounded-xl transition-all duration-300"
              >
                Skip for Now
              </motion.button>
            </motion.div>
          )}

          {/* Step 2: Details */}
          {step === 'details' && (
            <motion.form
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <h3 className="text-2xl font-bold text-white mb-2">
                Complete Your Profile
              </h3>
              <p className="text-slate-400 mb-6">
                Join the waitlist and get your unique referral link
              </p>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  X Username (optional)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-slate-500">@</span>
                  <input
                    type="text"
                    value={twitterHandle}
                    onChange={(e) => setTwitterHandle(e.target.value)}
                    placeholder="username"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-8 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 text-red-300 text-sm"
                >
                  {error}
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-300"
              >
                {loading ? 'Joining...' : 'Get Your Referral Link'}
              </motion.button>

              <button
                type="button"
                onClick={() => setStep('follow')}
                className="w-full text-slate-400 hover:text-slate-300 text-sm py-2 transition-colors"
              >
                Back
              </button>
            </motion.form>
          )}

          {/* Step 3: Success */}
          {step === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 15,
                  }}
                  className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  You&apos;re in!
                </h3>
                <p className="text-slate-400 text-sm">
                  You&apos;re position #{position} on the waitlist
                </p>
              </div>

              <div className="space-y-4 mb-6">
                {/* Referral Code */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-2">Referral Code</p>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-white font-mono font-semibold">
                      {referralCode}
                    </code>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => copyToClipboard(referralCode)}
                      className="text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </motion.button>
                  </div>
                </div>

                {/* Invite Link */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-2">Invite Link</p>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-white font-mono text-sm truncate">
                      {inviteLink}
                    </code>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => copyToClipboard(inviteLink)}
                      className="text-cyan-400 hover:text-cyan-300 transition-colors flex-shrink-0"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </motion.button>
                  </div>
                </div>

                {/* Referrals Progress */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-slate-400">Referrals</p>
                    <p className="text-white font-semibold">{referrals}</p>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(referrals * 10, 100)}%` }}
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-600"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Invite friends to move up in the waitlist
                  </p>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  const text = `Join ZeryTask - the Web3 productivity platform! 🚀\n\nJoin my referral: ${inviteLink}`;
                  window.open(
                    `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
                    '_blank'
                  );
                }}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75 2.25 7-7 7-7z" />
                </svg>
                Share on X
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
