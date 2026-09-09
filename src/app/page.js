import dynamic from "next/dynamic";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/landing/HeroSection";
import LineSidebar from "@/components/ui/LineSidebar";
import LazyAgentWidget from "@/components/ui/LazyAgentWidget";

// Below-the-fold sections — code-split so first paint stays lean.
const MarqueeRibbons = dynamic(() => import("@/components/landing/MarqueeRibbons"));
const StatsSection = dynamic(() => import("@/components/landing/StatsSection"));
const PopularEvents = dynamic(() => import("@/components/landing/PopularEvents"));
const CareerCatalyst = dynamic(() => import("@/components/landing/CareerCatalyst"));
const CommunityGrid = dynamic(() => import("@/components/landing/CommunityGrid"));
const CategoryGrid = dynamic(() => import("@/components/landing/CategoryGrid"));
const FeedbackSection = dynamic(() => import("@/components/landing/FeedbackSection"));
const EcosystemPartners = dynamic(() => import("@/components/landing/EcosystemPartners"));

export default function HomePage() {
  return (
    <>
      <Navbar forceDarkTop={true} />
      <LazyAgentWidget />

      <div className="fixed top-1/2 -translate-y-1/2 left-0 z-50 hidden 2xl:block pl-4">
        <LineSidebar
          accentColor="#f97316"
          items={[
            "hero-section",
            "stats-section",
            "popular-events",
            "career-catalyst",
            "communities",
            "categories",
            "feedback-section",
            "ecosystem-partners",
          ]}
        />
      </div>

      <main>
        <HeroSection />
        <MarqueeRibbons />
        <StatsSection />
        <PopularEvents />
        <CareerCatalyst />
        <CommunityGrid />
        <CategoryGrid />
        <FeedbackSection />
        <EcosystemPartners />
      </main>

      <Footer />
    </>
  );
}
