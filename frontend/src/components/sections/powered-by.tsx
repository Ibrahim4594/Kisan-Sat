"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Marquee } from "@/components/ui/marquee";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/language-provider";
import { translations } from "@/lib/translations";

const technologies = [
  {
    name: "NASA POWER",
    category: "Data Source",
    accent: "satellite-green" as const,
  },
  {
    name: "NASA Prithvi-EO-2.0",
    category: "Foundation Model",
    accent: "satellite-green" as const,
  },
  {
    name: "Anthropic Claude",
    category: "LLM Backbone",
    accent: "electric-blue" as const,
  },
  {
    name: "LangGraph",
    category: "Agent Orchestration",
    accent: "electric-blue" as const,
  },
  {
    name: "FastAPI",
    category: "Backend",
    accent: "satellite-green" as const,
  },
  {
    name: "Next.js 16",
    category: "Frontend",
    accent: "electric-blue" as const,
  },
  {
    name: "EfficientNet-B3",
    category: "Vision Model",
    accent: "satellite-green" as const,
  },
  {
    name: "XGBoost",
    category: "ML Pipeline",
    accent: "electric-blue" as const,
  },
  {
    name: "LSTM",
    category: "Time Series",
    accent: "satellite-green" as const,
  },
  {
    name: "Agromonitoring",
    category: "Satellite API",
    accent: "electric-blue" as const,
  },
];

function TechCard({ tech }: { tech: (typeof technologies)[number] }) {
  const isGreen = tech.accent === "satellite-green";

  return (
    <div
      className={cn(
        "shrink-0 rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-md px-5 py-3",
        "transition-all duration-300 hover:brightness-125 hover:bg-white/[0.06]"
      )}
    >
      <div className="flex items-center gap-3">
        {/* Dot indicator */}
        <div
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            isGreen ? "bg-satellite-green" : "bg-electric-blue"
          )}
        />

        <span className="text-sm font-medium text-white/75 whitespace-nowrap">
          {tech.name}
        </span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-mono whitespace-nowrap",
            isGreen
              ? "bg-satellite-green/10 text-satellite-green/75"
              : "bg-electric-blue/10 text-electric-blue/75"
          )}
        >
          {tech.category}
        </span>
      </div>
    </div>
  );
}

export function PoweredBySection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const { language } = useLanguage();
  const l = (t: { en: string; ur: string }) => t[language];

  return (
    <section ref={ref} className="relative py-20 overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-base-dark/30" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[600px] rounded-full bg-satellite-green/[0.03] blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative"
      >
        {/* Section header */}
        <div className="mb-10 flex flex-col items-center gap-3">
          <motion.div
            initial={{ width: 0 }}
            animate={isInView ? { width: 48 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="h-px bg-gradient-to-r from-transparent via-satellite-green/50 to-transparent"
          />
          <p className="text-center text-xs font-mono uppercase tracking-[0.3em] text-white/50">
            {l(translations.powered.subtitle)}
          </p>
          <motion.div
            initial={{ width: 0 }}
            animate={isInView ? { width: 48 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="h-px bg-gradient-to-r from-transparent via-satellite-green/50 to-transparent"
          />
        </div>

        {/* Marquee container */}
        <div className="relative rounded-2xl border border-border/30 bg-base-dark/20 py-6 mx-4 md:mx-8">
          {/* Fade edges */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 md:w-32 bg-gradient-to-r from-base-dark/90 via-base-dark/50 to-transparent rounded-l-2xl" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 md:w-32 bg-gradient-to-l from-base-dark/90 via-base-dark/50 to-transparent rounded-r-2xl" />

          {/* Row 1 */}
          <Marquee pauseOnHover className="[--duration:40s] [--gap:1rem]">
            {technologies.map((tech) => (
              <TechCard key={tech.name} tech={tech} />
            ))}
          </Marquee>

          {/* Row 2 - reverse */}
          <Marquee
            reverse
            pauseOnHover
            className="mt-4 [--duration:35s] [--gap:1rem]"
          >
            {technologies.map((tech) => (
              <TechCard key={tech.name} tech={tech} />
            ))}
          </Marquee>
        </div>

        {/* Bottom accent line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : {}}
          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
          className="mx-auto mt-8 h-px w-48 origin-center bg-gradient-to-r from-transparent via-satellite-green/20 to-transparent"
        />
      </motion.div>
    </section>
  );
}
