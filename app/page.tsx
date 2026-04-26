'use client';

import { HeroSection } from '@/components/HeroSection';
import { FeaturesSection } from '@/components/FeaturesSection';
import { VisionSection } from '@/components/VisionSection';
import { WaitlistSection } from '@/components/WaitlistSection';
import { FAQSectionWrapper } from '@/components/FAQSectionWrapper';
import { Footer } from '@/components/Footer';

export default function Home() {
  return (
    <main className="w-full overflow-hidden">
      <HeroSection />
      <FeaturesSection />
      <VisionSection />
      <WaitlistSection />
      <FAQSectionWrapper />
      <Footer />
    </main>
  );
}
