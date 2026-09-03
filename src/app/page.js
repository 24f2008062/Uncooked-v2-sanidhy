import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/landing/HeroSection";
import MarqueeRibbons from "@/components/landing/MarqueeRibbons";
import StatsSection from "@/components/landing/StatsSection";
import PopularEvents from "@/components/landing/PopularEvents";
import CareerCatalyst from "@/components/landing/CareerCatalyst";
import LiveFeed from "@/components/landing/LiveFeed";
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
            'career-catalyst',
            'live-feed',
            'communities',
            'categories',
            'feedback-section',
            'ecosystem-partners'
          ]}
        />
      </div>

      <main>
        {/* 1. Hero with floating event cards, search bar, location & category filters */}
        <HeroSection />

        {/* Crossed Marquee Ribbons */}
        <MarqueeRibbons />

        {/* Stats Section */}
        <StatsSection />

        {/* 2. Popular Events carousel */}
        <PopularEvents />

        {/* 3. Career Catalyst (Exclusive Work Opportunities) */}
        <CareerCatalyst />

        {/* 4. Campus Broadcast Bulletins (Live Feed) */}
        <LiveFeed />

        {/* 5. Global Communities */}
        <CommunityGrid />

        {/* 6. Browse by Category */}
        <CategoryGrid />

        {/* 7. Ecosystem Feedback & Attendee Reviews */}
        <FeedbackSection />

        {/* 8. Ecosystem Partners & Student Operating System */}
        <EcosystemPartners />
      </main>

      <Footer />
    </>
  );
}

