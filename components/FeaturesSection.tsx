'use client';

import { motion } from 'framer-motion';
import { FeatureCard } from './FeatureCard';
import { AnimatedSection } from './AnimatedSection';

export function FeaturesSection() {
  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: 'Task Missions',
      description:
        'Discover and complete curated tasks from top Web3 projects. Every task is designed to provide real value and meaningful engagement.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
        </svg>
      ),
      title: 'Referral Rewards',
      description:
        'Invite friends and move up the waitlist faster. Get rewarded for growing the community and helping others discover ZeryTask.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
        </svg>
      ),
      title: 'Community Growth',
      description:
        'Join a thriving community of Web3 enthusiasts. Collaborate with others, share knowledge, and grow together toward a decentralized future.',
    },
  ];

  return (
    <section className="relative py-20 md:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/30 to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <AnimatedSection className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            What is ZeryTask?
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            A platform where users can complete curated tasks, community
            missions, referral campaigns, and engagement challenges while
            earning rewards and unlocking exclusive access.
          </p>
        </AnimatedSection>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} delay={index * 0.15} />
          ))}
        </div>

        {/* What we do section */}
        <AnimatedSection className="mt-20 md:mt-32">
          <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-slate-700/50 rounded-3xl p-12 md:p-16">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-8">
              What We Do
            </h3>

            <p className="text-lg text-slate-300 mb-12 max-w-3xl">
              We connect projects, communities, and users through structured task
              systems that drive real engagement and measurable growth.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: 'Community Onboarding',
                  description:
                    'Streamlined processes for new users to join and contribute',
                },
                {
                  title: 'Viral Referral Systems',
                  description:
                    'Exponential growth through incentivized sharing and rewards',
                },
                {
                  title: 'Reward Distribution',
                  description:
                    'Fair and transparent compensation for completed tasks',
                },
                {
                  title: 'Early Access Campaigns',
                  description:
                    'Exclusive opportunities for members to access new launches',
                },
                {
                  title: 'Growth Automation',
                  description: 'Intelligent systems that scale with your community',
                },
                {
                  title: 'Data & Analytics',
                  description:
                    'Real-time insights into engagement and growth metrics',
                },
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  viewport={{ once: true }}
                  className="bg-slate-800/50 border border-slate-700/30 rounded-xl p-4 hover:border-cyan-500/30 transition-colors"
                >
                  <h4 className="font-semibold text-white mb-2">
                    {benefit.title}
                  </h4>
                  <p className="text-sm text-slate-400">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
