'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'How does the waitlist work?',
    answer:
      "You join the waitlist by signing up with your email and X handle. You'll get a unique referral code and invite link. Your position is determined by when you signed up, and you can move up faster by inviting friends.",
  },
  {
    question: 'How do referrals help?',
    answer:
      'Every time someone joins using your referral link, you earn a referral. The more referrals you get, the higher you move up on the waitlist. This creates a community-driven growth system where early members are rewarded.',
  },
  {
    question: 'Is ZeryTask free?',
    answer:
      'Yes! ZeryTask is free to use. We believe in making opportunity accessible to everyone. Our mission is to help communities scale faster and users earn fairly.',
  },
  {
    question: 'When does the platform launch?',
    answer:
      "We're launching soon! The exact date will be announced to waitlist members first. By joining the waitlist, you'll get early access and exclusive perks when we go live.",
  },
  {
    question: 'What missions can I complete?',
    answer:
      'ZeryTask features a variety of curated tasks including community onboarding, viral referral campaigns, engagement challenges, and early-stage Web3 opportunities. Tasks vary in difficulty and reward value.',
  },
  {
    question: 'How are rewards distributed?',
    answer:
      'Rewards are distributed based on verified task completions. We partner with communities and projects to offer real value—whether tokens, exclusive access, or other benefits.',
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {faqs.map((faq, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          viewport={{ once: true }}
        >
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full text-left"
          >
            <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-slate-700/50 hover:border-cyan-500/30 rounded-xl p-4 transition-all duration-300 group cursor-pointer">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors flex-1 text-left">
                  {faq.question}
                </h3>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex-shrink-0 text-cyan-500"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{
                  opacity: openIndex === index ? 1 : 0,
                  height: openIndex === index ? 'auto' : 0,
                }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <p className="text-slate-400 mt-3 leading-relaxed">
                  {faq.answer}
                </p>
              </motion.div>
            </div>
          </button>
        </motion.div>
      ))}
    </div>
  );
}
