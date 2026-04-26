'use client';

import { AnimatedSection } from './AnimatedSection';
import { FAQSection } from './FAQSection';

export function FAQSectionWrapper() {
  return (
    <section className="relative py-20 md:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 via-transparent to-slate-900/30 pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Have questions? We&apos;ve got answers. Learn more about ZeryTask
            and how to get started.
          </p>
        </AnimatedSection>

        <AnimatedSection className="mt-12">
          <FAQSection />
        </AnimatedSection>
      </div>
    </section>
  );
}
