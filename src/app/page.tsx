import { Hero } from "@/components/sections/hero";
import { About } from "@/components/sections/about";
import { Stats } from "@/components/sections/stats";
import { PracticeAreas } from "@/components/sections/practice-areas";
import { Team } from "@/components/sections/team";
import { BlogSectionWrapper } from "@/components/sections/blog-section-wrapper";
import { Contact } from "@/components/sections/contact";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppFAB } from "@/components/layout/whatsapp-fab";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <Stats />
        <PracticeAreas />
        <Team />
        <BlogSectionWrapper />
        <Contact />
      </main>
      <Footer />
      <WhatsAppFAB />
    </>
  );
}
