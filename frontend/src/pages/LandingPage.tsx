import { Navbar } from "@/components/landingPage/navbar";
import { HeroSection } from "@/components/landingPage/hero-section";
import { FeaturesSection } from "@/components/landingPage/features-section";
import { ServicesSection } from "@/components/landingPage/services-section";
import { WhyChooseUsSection } from "@/components/landingPage/why-choose-us-section";
import { PricingSection } from "@/components/landingPage/pricing-section";
import { TestimonialsSection } from "@/components/landingPage/testimonials-section";
import { CTASection } from "@/components/landingPage/cta-section";
import { Footer } from "@/components/landingPage/footer";
import { AboutSection } from "@/components/landingPage/about-us";
export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <FeaturesSection />
      <ServicesSection />
      <WhyChooseUsSection />
      <TestimonialsSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </main>
  );
}
