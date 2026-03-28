import { HeroSection } from "@/components/sections/hero";
import { PoweredBySection } from "@/components/sections/powered-by";
import { WhyKisanSatSection } from "@/components/sections/why-kisansat";
import { HowItWorksSection } from "@/components/sections/how-it-works";
import { DashboardPreviewSection } from "@/components/sections/dashboard-preview";
import { AgentPipelineSection } from "@/components/sections/agent-pipeline";
import { TechStackSection } from "@/components/sections/tech-stack";
import { CTASection } from "@/components/sections/cta-section";

export default function Home() {
  return (
    <>
      <HeroSection />
      <PoweredBySection />
      <WhyKisanSatSection />
      <HowItWorksSection />
      <DashboardPreviewSection />
      <AgentPipelineSection />
      <TechStackSection />
      <CTASection />
    </>
  );
}
