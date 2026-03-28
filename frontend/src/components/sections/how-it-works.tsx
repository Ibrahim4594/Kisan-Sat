"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  IconMapPin,
  IconRobot,
  IconFileCheck,
  IconArrowDown,
} from "@tabler/icons-react";
import { MagicCard } from "@/components/ui/magic-card";
import { BlurFade } from "@/components/ui/blur-fade";
import { TracingBeam } from "@/components/ui/tracing-beam";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/language-provider";
import { translations } from "@/lib/translations";

const steps = [
  {
    step: "01",
    icon: IconMapPin,
    title: "Enter Your Location",
    titleUrdu: "اپنا مقام درج کریں",
    description:
      "Click on the interactive map or enter coordinates to identify your farm location. Select your crop type and province.",
    details: [
      "Interactive satellite map",
      "Auto-detect coordinates via GPS",
      "Select crop type & season",
      "Choose province & district",
    ],
    gradientFrom: "#00ff88",
    gradientTo: "#10b981",
    iconColor: "text-satellite-green",
    stepColor: "text-satellite-green/30",
  },
  {
    step: "02",
    icon: IconRobot,
    title: "6 AI Agents Analyze",
    titleUrdu: "6 AI ایجنٹ تجزیہ کریں",
    description:
      "Our multi-agent pipeline processes NASA satellite data, weather forecasts, soil health, pest risks, and market prices in parallel.",
    details: [
      "Weather & climate analysis",
      "Soil moisture via NASA SMAP",
      "Pest & disease risk scoring",
      "Real-time market prices",
    ],
    gradientFrom: "#3b82f6",
    gradientTo: "#0ea5e9",
    iconColor: "text-electric-blue",
    stepColor: "text-electric-blue/30",
  },
  {
    step: "03",
    icon: IconFileCheck,
    title: "Get Crop Advisory",
    titleUrdu: "فصل ایڈوائزری حاصل کریں",
    description:
      "Receive a comprehensive bilingual advisory with specific actions for irrigation, fertilizer, pest management, and market timing.",
    details: [
      "Bilingual EN/Urdu report",
      "Irrigation & fertilizer plan",
      "Pest management actions",
      "Optimal market sell window",
    ],
    gradientFrom: "#f5a623",
    gradientTo: "#d4940a",
    iconColor: "text-harvest-gold",
    stepColor: "text-harvest-gold/30",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.8,
      delay: 0.3 * i,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  }),
};

const detailVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      delay: 0.08 * i,
      ease: "easeOut" as const,
    },
  }),
};

function StepCard({
  step,
  index,
  isInView,
}: {
  step: (typeof steps)[number];
  index: number;
  isInView: boolean;
}) {
  const { language } = useLanguage();
  const l = (t: { en: string; ur: string }) => t[language];

  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={cardVariants}
      className="relative"
    >
      {/* Vertical connector arrow between steps */}
      {index < steps.length - 1 && (
        <motion.div
          className="absolute -bottom-6 left-1/2 z-10 -translate-x-1/2"
          initial={{ opacity: 0, y: -4 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 * index + 0.6 }}
        >
          <IconArrowDown size={18} className="text-muted-foreground/30" />
        </motion.div>
      )}

      <MagicCard
        className="h-full rounded-2xl border-border/50 p-6"
        gradientFrom={step.gradientFrom}
        gradientTo={step.gradientTo}
        gradientColor="rgba(255,255,255,0.02)"
        gradientSize={220}
      >
        <div className="flex items-start gap-5">
          {/* Step number + icon column */}
          <div className="flex flex-col items-center gap-3 shrink-0">
            <span
              className={cn("font-mono text-5xl font-bold", step.stepColor)}
            >
              {step.step}
            </span>
            <motion.div
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-xl bg-white/5",
                step.iconColor
              )}
              initial={{ rotate: -8, scale: 0.9 }}
              animate={
                isInView ? { rotate: 0, scale: 1 } : { rotate: -8, scale: 0.9 }
              }
              transition={{
                duration: 0.6,
                delay: 0.3 * index + 0.2,
                type: "spring",
                stiffness: 200,
              }}
            >
              <step.icon size={28} stroke={1.5} />
            </motion.div>
          </div>

          {/* Text content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold font-display text-foreground">
              {l(translations.how.steps[index].title)}
            </h3>
            <p className="mt-3 text-sm text-white/60 leading-relaxed">
              {l(translations.how.steps[index].description)}
            </p>

            {/* Detail items with staggered reveal */}
            <div className="mt-4 space-y-2">
              {step.details.map((detail, detailIndex) => (
                <motion.div
                  key={detail}
                  custom={detailIndex + index * 4}
                  initial="hidden"
                  animate={isInView ? "visible" : "hidden"}
                  variants={detailVariants}
                  className="flex items-center gap-2"
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full shrink-0",
                      index === 0 && "bg-satellite-green/60",
                      index === 1 && "bg-electric-blue/60",
                      index === 2 && "bg-harvest-gold/60"
                    )}
                  />
                  <span className="text-xs text-white/50">
                    {detail}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </MagicCard>
    </motion.div>
  );
}

export function HowItWorksSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const { language } = useLanguage();
  const l = (t: { en: string; ur: string }) => t[language];

  return (
    <section ref={ref} className="relative py-24 lg:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-base-black to-base-dark/20" />

      <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
        {/* Header */}
        <BlurFade delay={0.1} inView={isInView}>
          <div className="mb-14 text-center">
            <span className="mb-4 inline-block rounded-full border border-satellite-green/20 bg-satellite-green/5 px-3 py-1 text-xs font-medium text-satellite-green">
              {l(translations.how.badge)}
            </span>
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {l(translations.how.title)}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-white/60">
              {l(translations.how.subtitle)}
            </p>
          </div>
        </BlurFade>

        {/* Steps wrapped in TracingBeam for vertical scroll tracking */}
        <TracingBeam className="max-w-2xl">
          <div className="flex flex-col gap-12">
            {steps.map((step, i) => (
              <StepCard key={step.step} step={step} index={i} isInView={isInView} />
            ))}
          </div>
        </TracingBeam>
      </div>
    </section>
  );
}
