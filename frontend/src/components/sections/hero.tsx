"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { IconArrowRight, IconSatellite } from "@tabler/icons-react";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { NumberTicker } from "@/components/ui/number-ticker";
import { Spotlight } from "@/components/ui/spotlight";
import { useLanguage } from "@/components/providers/language-provider";
import { translations } from "@/lib/translations";

const Globe = dynamic(
  () => import("@/components/ui/globe").then((mod) => ({ default: mod.Globe })),
  { ssr: false, loading: () => <div className="h-full w-full" /> }
);

const PAKISTAN_GLOBE_CONFIG = {
  width: 800,
  height: 800,
  onRender: () => {},
  devicePixelRatio: 2,
  phi: 0,
  theta: 0.25,
  dark: 1,
  diffuse: 1.2,
  mapSamples: 40000,
  mapBrightness: 6,
  baseColor: [0.05, 0.15, 0.08] as [number, number, number],
  markerColor: [0, 1, 0.53] as [number, number, number],
  glowColor: [0.05, 0.3, 0.15] as [number, number, number],
  markers: [
    { location: [30.3753, 69.3451] as [number, number], size: 0.12 },
    { location: [33.6844, 73.0479] as [number, number], size: 0.06 },
    { location: [24.8607, 67.0011] as [number, number], size: 0.06 },
    { location: [31.5204, 74.3587] as [number, number], size: 0.06 },
    { location: [34.0151, 71.5249] as [number, number], size: 0.04 },
  ],
};

const ease = [0.16, 1, 0.3, 1] as const;

const stats = [
  { value: 11, suffix: "M+", labelKey: "foodInsecure" as const, decimalPlaces: 0 },
  { value: 6, suffix: "", labelKey: "aiAgents" as const, decimalPlaces: 0 },
  { value: 1.1, suffix: "M", labelKey: "hectaresLost" as const, decimalPlaces: 1 },
] as const;

/* Seeded star positions to avoid hydration mismatch */
const STARS = Array.from({ length: 50 }).map((_, i) => ({
  w: ((i * 7 + 3) % 20) / 10 + 1,
  h: ((i * 13 + 7) % 20) / 10 + 1,
  x: ((i * 37 + 11) % 100),
  y: ((i * 53 + 23) % 100),
  opacity: ((i * 17 + 5) % 6) / 10 + 0.2,
  duration: ((i * 11 + 3) % 4) + 3,
  delay: ((i * 7 + 2) % 5),
}));

function Stars() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {STARS.map((star, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: star.w,
            height: star.h,
            left: `${star.x}%`,
            top: `${star.y}%`,
          }}
          animate={{
            opacity: [0, star.opacity, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export function HeroSection() {
  const { language } = useLanguage();
  const l = (t: { en: string; ur: string }) => t[language];
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const globeY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const globeOpacity = useTransform(scrollYProgress, [0, 0.6], [0.7, 0]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -60]);

  return (
    <section ref={sectionRef} className="relative min-h-dvh overflow-hidden bg-[#07090a]">
      {/* ——— BACKGROUND LAYERS ——— */}

      {/* 1. Spotlight — dramatic illumination from top-left */}
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="rgba(0, 255, 136, 0.15)"
      />

      {/* 2. Second spotlight — from top-right for depth */}
      <Spotlight
        className="-top-40 right-0 md:right-60 md:-top-20 scale-x-[-1]"
        fill="rgba(0, 200, 255, 0.08)"
      />

      {/* 3. Main radial glow — satellite green from top center */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-[300px] left-1/2 -translate-x-1/2 w-[1200px] h-[800px] rounded-full bg-satellite-green/[0.07] blur-[120px]" />
      </div>

      {/* 4. Secondary blue glow — bottom right */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -bottom-[200px] -right-[200px] w-[600px] h-[600px] rounded-full bg-electric-blue/[0.04] blur-[100px]" />
      </div>

      {/* 5. Purple accent — left side */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[40%] -left-[150px] w-[400px] h-[400px] rounded-full bg-agent-purple/[0.03] blur-[80px]" />
      </div>

      {/* 6. Animated stars */}
      <Stars />

      {/* 7. Globe — behind content, parallax on scroll */}
      <motion.div
        style={{ y: globeY, opacity: globeOpacity }}
        className="pointer-events-none absolute top-[50%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] sm:w-[700px] sm:h-[700px] lg:w-[800px] lg:h-[800px]"
      >
        <Globe config={PAKISTAN_GLOBE_CONFIG} className="w-full h-full" />
        {/* Globe inner glow */}
        <div className="absolute inset-[5%] rounded-full bg-satellite-green/[0.1] blur-[80px]" />
      </motion.div>

      {/* 8. Bottom gradient fade */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-60 bg-gradient-to-t from-[#07090a] via-[#07090a]/80 to-transparent" />

      {/* ——— CONTENT ——— */}
      <motion.div
        style={{ y: contentY }}
        dir={language === "ur" ? "rtl" : undefined}
        className="relative z-10 mx-auto flex min-h-dvh max-w-4xl flex-col items-center justify-center px-6 text-center"
      >
        {/* Badge — fade in + slide up */}
        <motion.div
          initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, ease }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2.5 rounded-full border border-satellite-green/25 bg-satellite-green/[0.04] px-5 py-2 text-[14px] font-medium text-satellite-green backdrop-blur-md">
            <IconSatellite size={15} stroke={1.5} />
            {l(translations.hero.badge)}
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-satellite-green opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-satellite-green" />
            </span>
          </span>
        </motion.div>

        {/* Main Heading — large, gradient, animated reveal */}
        <motion.h1
          initial={{ opacity: 0, y: 32, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.15, duration: 1, ease }}
          className="font-display text-[clamp(3rem,9vw,7rem)] font-bold leading-[0.9] tracking-[-0.04em]"
        >
          <span className="inline-block text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/30">
            Kisan
          </span>
          <span className="inline-block text-transparent bg-clip-text bg-gradient-to-b from-satellite-green via-emerald-400 to-satellite-green/40">
            Sat
          </span>
        </motion.h1>

        {/* Glowing line under heading — animated width expansion */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: 0.4, duration: 1.2, ease }}
          className="mt-4 h-px w-48 bg-gradient-to-r from-transparent via-satellite-green/50 to-transparent"
        />

        {/* Urdu — fade in */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 1 }}
          className="mt-4 text-xl tracking-widest text-harvest-gold/50"
          style={{ fontFamily: "system-ui" }}
        >
          {l(translations.hero.urduTagline)}
        </motion.p>

        {/* Subtitle — blur-fade reveal */}
        <motion.p
          initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.7, duration: 1, ease }}
          className="mt-10 max-w-xl text-lg leading-relaxed text-white/70"
        >
          {l(translations.hero.subtitle)}
        </motion.p>
        {language === "ur" ? null : (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 1 }}
          className="mt-3 max-w-xl text-sm leading-relaxed text-harvest-gold/50"
          dir="rtl"
        >
          {translations.hero.subtitle.ur}
        </motion.p>
        )}

        {/* CTA buttons — slide up with blur */}
        <motion.div
          initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 1.2, duration: 0.9, ease }}
          className="mt-12 flex items-center gap-5"
        >
          <Link href="/dashboard">
            <ShimmerButton
              shimmerColor="rgba(0, 255, 136, 0.3)"
              shimmerSize="0.05em"
              shimmerDuration="3s"
              background="rgba(0, 255, 136, 0.08)"
              borderRadius="12px"
              className="h-12 px-7 text-[15px] font-medium text-satellite-green"
            >
              {l(translations.hero.ctaPrimary)}
              <IconArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-0.5" />
            </ShimmerButton>
          </Link>
          <Link
            href="#about"
            className="h-12 flex items-center px-6 text-[15px] font-medium text-white/50 rounded-xl border border-white/[0.08] transition-all duration-300 hover:text-white/70 hover:border-white/[0.15] hover:bg-white/[0.03]"
          >
            {l(translations.hero.ctaSecondary)}
          </Link>
        </motion.div>

        {/* Stats — stagger reveal */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8, ease }}
          className="mt-20 flex items-center"
        >
          {stats.map((stat, i) => (
            <div key={stat.labelKey} className="flex items-center">
              {i > 0 && (
                <div className="h-8 w-px bg-white/[0.12] mx-8 sm:mx-12" />
              )}
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex items-baseline gap-0.5 font-display text-4xl font-semibold sm:text-5xl">
                  <NumberTicker
                    value={stat.value}
                    delay={1.8 + i * 0.15}
                    decimalPlaces={stat.decimalPlaces}
                    className="text-white/90"
                  />
                  <span className="text-sm text-satellite-green/80">{stat.suffix}</span>
                </div>
                <span className="text-[11px] text-white/45 tracking-[0.2em] uppercase font-medium">
                  {l(translations.hero.stats[stat.labelKey])}
                </span>
                {language === "en" && (
                <span className="text-[10px] text-harvest-gold/40" dir="rtl">
                  {translations.hero.stats[stat.labelKey].ur}
                </span>
                )}
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Bottom gradient divider line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-satellite-green/15 to-transparent" />
    </section>
  );
}
