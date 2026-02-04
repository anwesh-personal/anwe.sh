import {
  Navigation,
  Hero,
  Expertise,
  Stats,
  Journey,
  CTA,
  Footer,
} from '@/components/marketing';

// Force dynamic rendering for theme to load from database
export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <>
      <Navigation />
      <main>
        <Hero />
        <Expertise />
        <Stats />
        <Journey />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
