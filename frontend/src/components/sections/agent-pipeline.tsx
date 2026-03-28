"use client";

import { type ReactNode, useRef, forwardRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Brain,
  CloudSun,
  Sprout,
  Bug,
  TrendingUp,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { useLanguage } from "@/components/providers/language-provider";
import { translations } from "@/lib/translations";

/* ── Agent data ─────────────────────────────────────────────────────── */

type AgentColor = "green" | "blue" | "purple" | "gold";

interface AgentInfo {
  id: string;
  name: string;
  description: string;
  icon: ReactNode;
  color: AgentColor;
}

const agents: Record<string, AgentInfo> = {
  supervisor: {
    id: "supervisor",
    name: "Supervisor",
    description: "Orchestrates the pipeline and routes tasks to specialized agents",
    icon: <Brain className="h-6 w-6" />,
    color: "purple",
  },
  weather: {
    id: "weather",
    name: "Weather Agent",
    description: "Analyzes atmospheric data, forecasts, and climate risk patterns",
    icon: <CloudSun className="h-6 w-6" />,
    color: "blue",
  },
  soil: {
    id: "soil",
    name: "Soil & Crop Agent",
    description: "Processes satellite imagery for soil health and crop status via Prithvi-EO",
    icon: <Sprout className="h-6 w-6" />,
    color: "green",
  },
  pest: {
    id: "pest",
    name: "Pest & Disease Agent",
    description: "Detects crop diseases using EfficientNet and correlates with weather risk",
    icon: <Bug className="h-6 w-6" />,
    color: "gold",
  },
  market: {
    id: "market",
    name: "Market Agent",
    description: "Tracks commodity prices and forecasts market trends with LSTM models",
    icon: <TrendingUp className="h-6 w-6" />,
    color: "blue",
  },
  advisory: {
    id: "advisory",
    name: "Advisory Agent",
    description: "Synthesizes all agent outputs into actionable bilingual crop advisories",
    icon: <FileText className="h-6 w-6" />,
    color: "green",
  },
};

/* ── Color config ───────────────────────────────────────────────────── */

const colorStyles: Record<AgentColor, { border: string; glow: string; icon: string; bg: string; hex: string }> = {
  green: {
    border: "border-satellite-green/20 hover:border-satellite-green/40",
    glow: "group-hover:shadow-[0_0_30px_rgba(0,255,136,0.1)]",
    icon: "text-satellite-green",
    bg: "bg-satellite-green/5",
    hex: "#00ff88",
  },
  blue: {
    border: "border-electric-blue/20 hover:border-electric-blue/40",
    glow: "group-hover:shadow-[0_0_30px_rgba(59,130,246,0.1)]",
    icon: "text-electric-blue",
    bg: "bg-electric-blue/5",
    hex: "#3b82f6",
  },
  purple: {
    border: "border-agent-purple/20 hover:border-agent-purple/40",
    glow: "group-hover:shadow-[0_0_30px_rgba(139,92,246,0.1)]",
    icon: "text-agent-purple",
    bg: "bg-agent-purple/5",
    hex: "#8b5cf6",
  },
  gold: {
    border: "border-harvest-gold/20 hover:border-harvest-gold/40",
    glow: "group-hover:shadow-[0_0_30px_rgba(245,166,35,0.1)]",
    icon: "text-harvest-gold",
    bg: "bg-harvest-gold/5",
    hex: "#f5a623",
  },
};

/* ── Agent node card ────────────────────────────────────────────────── */

const AgentNode = forwardRef<
  HTMLDivElement,
  {
    agent: AgentInfo;
    index: number;
    isInView: boolean;
  }
>(({ agent, index, isInView }, ref) => {
  const style = colorStyles[agent.color];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{
        duration: 0.7,
        delay: 0.15 * index,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="group relative"
    >
      <div
        className={cn(
          "relative overflow-hidden glass rounded-xl border p-5 transition-all duration-500 cursor-default",
          style.border,
          style.glow
        )}
      >
        {/* Status dot */}
        <div className="absolute top-3 right-3 z-10">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={cn(
                "absolute inline-flex h-full w-full animate-ping rounded-full opacity-50",
                agent.color === "green" ? "bg-satellite-green"
                  : agent.color === "blue" ? "bg-electric-blue"
                    : agent.color === "purple" ? "bg-agent-purple"
                      : "bg-harvest-gold"
              )}
            />
            <span
              className={cn(
                "relative inline-flex h-2.5 w-2.5 rounded-full",
                agent.color === "green" ? "bg-satellite-green"
                  : agent.color === "blue" ? "bg-electric-blue"
                    : agent.color === "purple" ? "bg-agent-purple"
                      : "bg-harvest-gold"
              )}
            />
          </span>
        </div>

        {/* Icon */}
        <div
          className={cn(
            "relative z-10 mb-3 flex h-10 w-10 items-center justify-center rounded-lg",
            style.bg,
            style.icon
          )}
        >
          {agent.icon}
        </div>

        {/* Text */}
        <h3 className="relative z-10 font-display text-sm font-semibold text-foreground">
          {agent.name}
        </h3>
        <p className="relative z-10 mt-1.5 text-xs leading-relaxed text-muted-foreground">
          {agent.description}
        </p>
      </div>
    </motion.div>
  );
});

AgentNode.displayName = "AgentNode";

/* ── Phase label ────────────────────────────────────────────────────── */

function PhaseLabel({ text, step, isInView, delay }: { text: string; step: string; isInView: boolean; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="flex items-center gap-2 mb-3"
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-satellite-green/70">
        {step}
      </span>
      <div className="h-px flex-1 bg-gradient-to-r from-satellite-green/10 to-transparent" />
      <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70">
        {text}
      </span>
    </motion.div>
  );
}

/* ── Main section ───────────────────────────────────────────────────── */

export function AgentPipelineSection() {
  const { language } = useLanguage();
  const l = (t: { en: string; ur: string }) => t[language];
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  /* Refs for AnimatedBeam — container + each agent node */
  const containerRef = useRef<HTMLDivElement>(null);
  const supervisorRef = useRef<HTMLDivElement>(null);
  const weatherRef = useRef<HTMLDivElement>(null);
  const soilRef = useRef<HTMLDivElement>(null);
  const pestRef = useRef<HTMLDivElement>(null);
  const marketRef = useRef<HTMLDivElement>(null);
  const advisoryRef = useRef<HTMLDivElement>(null);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-24 lg:py-32"
    >
      {/* Background treatment */}
      <div className="absolute inset-0 bg-gradient-to-b from-base-black via-base-dark/50 to-base-black" />
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,255,136,0.3) 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative mx-auto max-w-5xl px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16 text-center"
        >
          <span className="mb-4 inline-block rounded-full border border-agent-purple/20 bg-agent-purple/5 px-3 py-1 text-xs font-medium text-agent-purple">
            {l(translations.pipeline.badge)}
          </span>
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {l(translations.pipeline.title)}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground lg:text-lg">
            {l(translations.pipeline.subtitle)}
          </p>
        </motion.div>

        {/* Pipeline visualization — container for AnimatedBeams */}
        <div ref={containerRef} className="relative flex flex-col items-center">

          {/* ── Phase 1: Supervisor ── */}
          <div className="w-full max-w-xs">
            <PhaseLabel text={l(translations.pipeline.phases.orchestration)} step="01" isInView={isInView} delay={0} />
            <AgentNode
              ref={supervisorRef}
              agent={{ ...agents.supervisor, name: l(translations.pipeline.agents.supervisor.name), description: l(translations.pipeline.agents.supervisor.description) }}
              index={0}
              isInView={isInView}
            />
          </div>

          {/* Spacer for beam path */}
          <div className="h-12 lg:h-16" />

          {/* ── Phase 2: Weather + Soil (parallel) ── */}
          <div className="w-full">
            <PhaseLabel text={l(translations.pipeline.phases.parallelIngestion)} step="02" isInView={isInView} delay={0.3} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <AgentNode ref={weatherRef} agent={{ ...agents.weather, name: l(translations.pipeline.agents.weather.name), description: l(translations.pipeline.agents.weather.description) }} index={1} isInView={isInView} />
              <AgentNode ref={soilRef} agent={{ ...agents.soil, name: l(translations.pipeline.agents.soil.name), description: l(translations.pipeline.agents.soil.description) }} index={2} isInView={isInView} />
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.5 }}
              className="mt-2 flex items-center justify-center gap-2"
            >
              <div className="h-px w-8 bg-electric-blue/20" />
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-electric-blue/60">
                {l(translations.pipeline.phases.parallel)}
              </span>
              <div className="h-px w-8 bg-electric-blue/20" />
            </motion.div>
          </div>

          {/* Spacer for beam path */}
          <div className="h-12 lg:h-16" />

          {/* ── Phase 3: Pest + Market (parallel) ── */}
          <div className="w-full">
            <PhaseLabel text={l(translations.pipeline.phases.parallelAnalysis)} step="03" isInView={isInView} delay={0.6} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <AgentNode ref={pestRef} agent={{ ...agents.pest, name: l(translations.pipeline.agents.pest.name), description: l(translations.pipeline.agents.pest.description) }} index={3} isInView={isInView} />
              <AgentNode ref={marketRef} agent={{ ...agents.market, name: l(translations.pipeline.agents.market.name), description: l(translations.pipeline.agents.market.description) }} index={4} isInView={isInView} />
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.8 }}
              className="mt-2 flex items-center justify-center gap-2"
            >
              <div className="h-px w-8 bg-harvest-gold/20" />
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-harvest-gold/60">
                {l(translations.pipeline.phases.parallel)}
              </span>
              <div className="h-px w-8 bg-harvest-gold/20" />
            </motion.div>
          </div>

          {/* Spacer for beam path */}
          <div className="h-12 lg:h-16" />

          {/* ── Phase 4: Advisory ── */}
          <div className="w-full max-w-xs">
            <PhaseLabel text={l(translations.pipeline.phases.synthesis)} step="04" isInView={isInView} delay={0.9} />
            <AgentNode ref={advisoryRef} agent={{ ...agents.advisory, name: l(translations.pipeline.agents.advisory.name), description: l(translations.pipeline.agents.advisory.description) }} index={5} isInView={isInView} />
          </div>

          {/* Spacer */}
          <div className="h-12 lg:h-16" />

          {/* Output badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 1.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 rounded-full border border-satellite-green/30 bg-satellite-green/10 px-5 py-2 glow-green"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-satellite-green opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-satellite-green" />
            </span>
            <span className="text-sm font-medium text-satellite-green">
              {l(translations.pipeline.phases.output)}
            </span>
          </motion.div>

          {/* ── AnimatedBeam connections ── */}

          {/* Supervisor -> Weather */}
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={supervisorRef}
            toRef={weatherRef}
            curvature={-30}
            pathColor={colorStyles.purple.hex + "22"}
            pathWidth={2}
            pathOpacity={0.15}
            gradientStartColor={colorStyles.purple.hex}
            gradientStopColor={colorStyles.blue.hex}
            duration={4}
            delay={0}
            startYOffset={10}
            endYOffset={-10}
          />

          {/* Supervisor -> Soil */}
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={supervisorRef}
            toRef={soilRef}
            curvature={30}
            pathColor={colorStyles.purple.hex + "22"}
            pathWidth={2}
            pathOpacity={0.15}
            gradientStartColor={colorStyles.purple.hex}
            gradientStopColor={colorStyles.green.hex}
            duration={4}
            delay={0.5}
            startYOffset={10}
            endYOffset={-10}
          />

          {/* Weather -> Pest */}
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={weatherRef}
            toRef={pestRef}
            curvature={-20}
            pathColor={colorStyles.blue.hex + "22"}
            pathWidth={2}
            pathOpacity={0.15}
            gradientStartColor={colorStyles.blue.hex}
            gradientStopColor={colorStyles.gold.hex}
            duration={4}
            delay={1}
            startYOffset={10}
            endYOffset={-10}
          />

          {/* Weather -> Market */}
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={weatherRef}
            toRef={marketRef}
            curvature={20}
            pathColor={colorStyles.blue.hex + "22"}
            pathWidth={2}
            pathOpacity={0.15}
            gradientStartColor={colorStyles.blue.hex}
            gradientStopColor={colorStyles.blue.hex}
            duration={4.5}
            delay={1.2}
            startYOffset={10}
            endYOffset={-10}
          />

          {/* Soil -> Pest */}
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={soilRef}
            toRef={pestRef}
            curvature={-20}
            pathColor={colorStyles.green.hex + "22"}
            pathWidth={2}
            pathOpacity={0.15}
            gradientStartColor={colorStyles.green.hex}
            gradientStopColor={colorStyles.gold.hex}
            duration={4.5}
            delay={1.5}
            startYOffset={10}
            endYOffset={-10}
          />

          {/* Soil -> Market */}
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={soilRef}
            toRef={marketRef}
            curvature={20}
            pathColor={colorStyles.green.hex + "22"}
            pathWidth={2}
            pathOpacity={0.15}
            gradientStartColor={colorStyles.green.hex}
            gradientStopColor={colorStyles.blue.hex}
            duration={4}
            delay={1.8}
            startYOffset={10}
            endYOffset={-10}
          />

          {/* Pest -> Advisory */}
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={pestRef}
            toRef={advisoryRef}
            curvature={-30}
            pathColor={colorStyles.gold.hex + "22"}
            pathWidth={2}
            pathOpacity={0.15}
            gradientStartColor={colorStyles.gold.hex}
            gradientStopColor={colorStyles.green.hex}
            duration={4}
            delay={2}
            startYOffset={10}
            endYOffset={-10}
          />

          {/* Market -> Advisory */}
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={marketRef}
            toRef={advisoryRef}
            curvature={30}
            pathColor={colorStyles.blue.hex + "22"}
            pathWidth={2}
            pathOpacity={0.15}
            gradientStartColor={colorStyles.blue.hex}
            gradientStopColor={colorStyles.green.hex}
            duration={4}
            delay={2.3}
            startYOffset={10}
            endYOffset={-10}
          />
        </div>
      </div>
    </section>
  );
}
