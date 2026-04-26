'use client';

import { motion } from 'framer-motion';
import { WaitlistCard } from './WaitlistCard';
import { AnimatedSection } from './AnimatedSection';

export function WaitlistSection() {
  return (
    <section className="relative py-20 md:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/20 to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <AnimatedSection>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Join the Waitlist
            </h2>

            <p className="text-lg text-slate-300 mb-8 leading-relaxed">
              Be among the first to experience ZeryTask. Early members get
              exclusive perks, priority access to premium tasks, and higher
              reward multipliers.
            </p>

            <div className="space-y-6">
              {[
                {
                  title: 'Early Access',
                  description:
                    'Get first access to the platform before public launch',
                },
                {
                  title: 'Higher Rewards',
                  description:
                    'Earn better rewards as an early adopter of ZeryTask',
                },
                {
                  title: 'Exclusive Tasks',
                  description:
                    'Participate in founder-only missions and opportunities',
                },
                {
                  title: 'Referral Bonuses',
                  description:
                    'Move up the waitlist and earn extra rewards by inviting friends',
                },
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex gap-4"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-6 h-6 text-cyan-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">
                      {benefit.title}
                    </h4>
                    <p className="text-sm text-slate-400">
                      {benefit.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatedSection>

          {/* Right: Waitlist Card */}
          <AnimatedSection className="flex justify-center lg:justify-end">
            <WaitlistCard />
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
