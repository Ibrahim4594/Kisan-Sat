"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { IconAlertTriangle, IconUserOff, IconRadar } from "@tabler/icons-react";
import { MagicCard } from "@/components/ui/magic-card";
import { NumberTicker } from "@/components/ui/number-ticker";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/language-provider";
import { translations } from "@/lib/translations";

const problems = [
  {
    icon: IconAlertTriangle,
    stat: 1.1,
    prefix: "",
    suffix: "M",
    decimalPlaces: 1,
    label: "Hectares Destroyed",
    labelUrdu: "فصلوں کی زمین تباہ",
    description:
      "1.1 million hectares of cropland destroyed in the 2022 Pakistan floods, assessed via Sentinel-1, Sentinel-2, and GPM satellite data.",
    source: "Source: Nature Scientific Reports, 2023",
    gradientFrom: "#f5a623",
    gradientTo: "#d4940a",
    iconColor: "text-harvest-gold",
  },
  {
    icon: IconUserOff,
    stat: 11,
    prefix: "",
    suffix: "M",
    decimalPlaces: 0,
    label: "Food Insecure",
    labelUrdu: "غذائی عدم تحفظ",
    description:
      "11 million people facing acute food insecurity (IPC Phase 3+) across 68 flood-affected districts in Balochistan, Sindh, and KPK.",
    source: "Source: WFP/IPC Pakistan, 2024",
    gradientFrom: "#ef4444",
    gradientTo: "#dc2626",
    iconColor: "text-red-500",
  },
  {
    icon: IconRadar,
    stat: 33,
    prefix: "",
    suffix: "M",
    decimalPlaces: 0,
    label: "People Affected",
    labelUrdu: "متاثرہ لوگ",
    description:
      "33 million people affected by the 2022 Pakistan floods with 88% cotton and 80% rice production lost — devastating the agricultural backbone.",
    source: "Source: Nature Scientific Reports, 2023",
    gradientFrom: "#3b82f6",
    gradientTo: "#0ea5e9",
    iconColor: "text-electric-blue",
  },
];

export function WhyKisanSatSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const { language } = useLanguage();
  const l = (t: { en: string; ur: string }) => t[language];

  return (
    <section ref={ref} id="about" className="relative overflow-hidden py-24 lg:py-32">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-base-black via-base-dark/30 to-base-black" />

      <div className="relative z-10 mx-auto max-w-6xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-14 text-center"
        >
          <span className="mb-4 inline-block rounded-full border border-harvest-gold/20 bg-harvest-gold/5 px-3 py-1 text-xs font-medium text-harvest-gold">
            {l(translations.why.badge)}
          </span>
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {l(translations.why.title)}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/60 lg:text-lg">
            {l(translations.why.subtitle)}
          </p>
        </motion.div>

        {/* Magic UI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {problems.map((problem, i) => (
            <motion.div
              key={problem.label}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.7,
                delay: 0.15 * i,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="relative"
            >
              <MagicCard
                className="relative h-full rounded-2xl border-border/50 p-6"
                gradientFrom={problem.gradientFrom}
                gradientTo={problem.gradientTo}
                gradientColor="rgba(255,255,255,0.03)"
                gradientSize={250}
              >
                {/* Icon */}
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 ${problem.iconColor}`}>
                  <problem.icon size={24} stroke={1.5} />
                </div>

                {/* Stat with NumberTicker */}
                <div className="font-display text-4xl font-bold tracking-tight">
                  <span className={problem.iconColor}>{problem.prefix}</span>
                  <NumberTicker
                    value={problem.stat}
                    delay={0.5 + i * 0.2}
                    decimalPlaces={problem.decimalPlaces}
                    className={problem.iconColor}
                  />
                  <span className={problem.iconColor}>{problem.suffix}</span>
                </div>

                <p className="mt-1 text-sm font-semibold text-foreground font-display">
                  {l(translations.why.cards[i].title)}
                </p>

                {/* Description */}
                <p className="mt-3 text-sm text-white/60 leading-relaxed">
                  {l(translations.why.cards[i].description)}
                </p>
                <span className="text-[10px] text-white/30 mt-2 block">{problem.source}</span>
              </MagicCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
