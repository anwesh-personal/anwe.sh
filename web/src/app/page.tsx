import {
  Navigation,
  Hero,
  Expertise,
  Stats,
  Journey,
  CTA,
  Footer,
} from '@/components/marketing';

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
