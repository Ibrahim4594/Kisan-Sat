"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  IconSatellite,
  IconBrain,
  IconTopologyStarRing3,
  IconServer,
  IconDeviceDesktop,
  IconCloudComputing,
  IconEye,
  IconChartBar,
} from "@tabler/icons-react";
import { Particles } from "@/components/ui/particles";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/language-provider";
import { translations } from "@/lib/translations";

interface TechItem {
  name: string;
  description: string;
  icon: React.ComponentType<{ size?: number; stroke?: number; className?: string }>;
  accent: string;
  accentBg: string;
  beamFrom: string;
  beamTo: string;
  category: string;
}

const techStack: TechItem[] = [
  {
    name: "NASA Prithvi-EO-2.0",
    description: "300M-parameter geospatial foundation model for satellite image analysis and land classification",
    icon: IconSatellite,
    accent: "text-satellite-green",
    accentBg: "bg-satellite-green/10",
    beamFrom: "#00ff88",
    beamTo: "#10b981",
    category: "AI/ML",
  },
  {
    name: "Anthropic Claude",
    description: "Powers advisory synthesis, bilingual generation, and agricultural reasoning across all agents",
    icon: IconBrain,
    accent: "text-agent-purple",
    accentBg: "bg-agent-purple/10",
    beamFrom: "#8b5cf6",
    beamTo: "#7c3aed",
    category: "AI/ML",
  },
  {
    name: "LangGraph",
    description: "Stateful multi-agent orchestration with parallel execution, conditional routing, and shared memory",
    icon: IconTopologyStarRing3,
    accent: "text-electric-blue",
    accentBg: "bg-electric-blue/10",
    beamFrom: "#3b82f6",
    beamTo: "#0ea5e9",
    category: "Backend",
  },
  {
    name: "FastAPI + WebSocket",
    description: "High-performance async backend with real-time streaming of agent progress to frontend",
    icon: IconServer,
    accent: "text-satellite-green",
    accentBg: "bg-satellite-green/10",
    beamFrom: "#00ff88",
    beamTo: "#059669",
    category: "Backend",
  },
  {
    name: "Next.js 16 + React 19",
    description: "Server Components, Turbopack, and award-winning UI with 3D globe, glassmorphism, and animations",
    icon: IconDeviceDesktop,
    accent: "text-electric-blue",
    accentBg: "bg-electric-blue/10",
    beamFrom: "#3b82f6",
    beamTo: "#6366f1",
    category: "Frontend",
  },
  {
    name: "NASA POWER & Agromonitoring",
    description: "Meteorological data APIs providing 30+ years of climate data and real-time satellite imagery",
    icon: IconCloudComputing,
    accent: "text-harvest-gold",
    accentBg: "bg-harvest-gold/10",
    beamFrom: "#f5a623",
    beamTo: "#d4940a",
    category: "Data",
  },
  {
    name: "EfficientNet-B3",
    description: "Transfer learning model for Pakistani crop disease detection from PlantVillage dataset",
    icon: IconEye,
    accent: "text-harvest-gold",
    accentBg: "bg-harvest-gold/10",
    beamFrom: "#f5a623",
    beamTo: "#ea580c",
    category: "AI/ML",
  },
  {
    name: "XGBoost + LSTM",
    description: "Ensemble models for pest risk scoring and crop yield prediction from time-series data",
    icon: IconChartBar,
    accent: "text-agent-purple",
    accentBg: "bg-agent-purple/10",
    beamFrom: "#8b5cf6",
    beamTo: "#a855f7",
    category: "AI/ML",
  },
];

// Bento grid layout: some items span 2 cols for asymmetric look
// Row 1: [span-2] [span-1] [span-1]  (4 cols total on lg)
// Row 2: [span-1] [span-1] [span-2]
const bentoSpans = [
  "md:col-span-2",   // Prithvi-EO — hero card, large
  "md:col-span-1",   // Claude
  "md:col-span-1",   // LangGraph
  "md:col-span-1",   // FastAPI
  "md:col-span-1",   // Next.js
  "md:col-span-2",   // NASA POWER — hero card, large
  "md:col-span-1",   // EfficientNet
  "md:col-span-1",   // XGBoost
];

export function TechStackSection() {
  const { language } = useLanguage();
  const l = (t: { en: string; ur: string }) => t[language];
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <section ref={ref} className="relative py-24 lg:py-32 overflow-hidden">
      {/* Layered backgrounds */}
      <div className="absolute inset-0 bg-gradient-to-b from-base-dark/20 via-base-black to-base-dark/30" />

      {/* Particles background */}
      <Particles
        className="absolute inset-0"
        quantity={30}
        color="#3b82f6"
        ease={80}
        size={0.3}
        staticity={50}
        refresh
      />

      <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-14 text-center"
        >
          <span className="mb-4 inline-block rounded-full border border-electric-blue/20 bg-electric-blue/5 px-3 py-1 text-xs font-medium text-electric-blue">
            {l(translations.tech.badge)}
          </span>
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {l(translations.tech.title)}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
            {l(translations.tech.subtitle)}
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          {techStack.map((tech, i) => {
            const isWide = bentoSpans[i]?.includes("col-span-2");
            return (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, y: 24 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: 0.5,
                  delay: 0.07 * i,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={cn(
                  "group relative",
                  bentoSpans[i],
                )}
              >
                {/* Card */}
                <div
                  className={cn(
                    "relative h-full overflow-hidden rounded-xl",
                    "border border-white/[0.06] bg-white/[0.02]",
                    "backdrop-blur-sm",
                    "transition-all duration-300",
                    "group-hover:border-white/[0.12] group-hover:bg-white/[0.04] group-hover:scale-[1.01]",
                    isWide ? "p-6" : "p-5",
                  )}
                >

                  {/* Content layout: horizontal for wide cards, vertical for small */}
                  <div className={cn(
                    isWide
                      ? "flex items-start gap-5"
                      : "flex flex-col",
                  )}>
                    {/* Icon */}
                    <div
                      className={cn(
                        "flex shrink-0 items-center justify-center rounded-lg",
                        tech.accentBg,
                        tech.accent,
                        isWide ? "h-12 w-12" : "mb-3 h-10 w-10",
                        "transition-transform duration-300 group-hover:scale-110",
                      )}
                    >
                      <tech.icon size={isWide ? 24 : 20} stroke={1.5} />
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* Category tag */}
                      <span
                        className={cn(
                          "mb-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                          tech.accentBg,
                          tech.accent,
                          "opacity-70",
                        )}
                      >
                        {tech.category}
                      </span>

                      {/* Title */}
                      <h3 className={cn(
                        "font-display font-semibold text-foreground",
                        isWide ? "text-base" : "text-sm",
                      )}>
                        {tech.name}
                      </h3>

                      {/* Description */}
                      <p className={cn(
                        "mt-1.5 text-muted-foreground leading-relaxed",
                        isWide ? "text-sm" : "text-xs",
                      )}>
                        {tech.description}
                      </p>
                    </div>
                  </div>

                  {/* Subtle gradient overlay at bottom for depth */}
                  <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-16 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                      background: `linear-gradient(to top, ${tech.beamFrom}06, transparent)`,
                    }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
