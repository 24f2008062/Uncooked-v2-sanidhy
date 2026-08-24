import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/landing/HeroSection";
import MarqueeRibbons from "@/components/landing/MarqueeRibbons";
import StatsSection from "@/components/landing/StatsSection";
import PopularEvents from "@/components/landing/PopularEvents";
import CommunityGrid from "@/components/landing/CommunityGrid";
import CategoryGrid from "@/components/landing/CategoryGrid";
import FeedbackSection from "@/components/landing/FeedbackSection";
import EcosystemPartners from "@/components/landing/EcosystemPartners";
import LineSidebar from "@/components/ui/LineSidebar";
import AgentWidget from "@/components/ui/AgentWidget";

export default function HomePage() {
  return (
    <>
      <Navbar forceDarkTop={true} />
      <AgentWidget />

      {/* Fixed Sidebar for Navigation */}
      <div className="fixed top-1/2 -translate-y-1/2 left-0 z-50 hidden 2xl:block pl-4">
        <LineSidebar 
          accentColor="#f97316"
          items={[
            'hero-section',
            'stats-section',
            'popular-events',
            'communities',
            'categories',
            'feedback-section',
            'ecosystem-partners'
          ]}
        />
      </div>

      <main>
        {/* 1. Hero with floating event cards */}
        <HeroSection />

        {/* Crossed Marquee Ribbons */}
        <MarqueeRibbons />

        {/* Stats Section */}
        <StatsSection />

        {/* 2. Popular Events carousel */}
        <PopularEvents />

        {/* 3. Global Communities */}
        <CommunityGrid />

        {/* 4. Browse by Category */}
        <CategoryGrid />

        {/* 5. Feedback & Logs */}
        <FeedbackSection />

        {/* 7. Ecosystem Partners */}
        <EcosystemPartners />
      </main>

      <Footer />
    </>
  );
}
