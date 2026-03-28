"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  IconCloudRain,
  IconPlant,
  IconBug,
  IconCoin,
  IconBrain,
  IconMapPin,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { BorderBeam } from "@/components/ui/border-beam";
import { useLanguage } from "@/components/providers/language-provider";
import { translations } from "@/lib/translations";

const ease = [0.16, 1, 0.3, 1] as const;

/* Simulated agent terminal output */
const terminalLines = [
  { agent: "Supervisor", color: "text-agent-purple", text: "Validating query... Location: Lahore (31.52\u00b0N, 74.36\u00b0E), Crop: Wheat, Season: Rabi" },
  { agent: "Weather", color: "text-electric-blue", text: "NASA POWER \u2192 Temp: 22\u00b0C, Humidity: 58%, Precipitation: 2.1mm (30-day avg)" },
  { agent: "Soil/Crop", color: "text-satellite-green", text: "NDVI: 0.72 (healthy), Soil Moisture: 34%, Recommended: Wheat \u2713 (0.91 confidence)" },
  { agent: "Pest Risk", color: "text-harvest-gold", text: "Risk: MODERATE \u2014 Wheat Aphid alert (temp 18-25\u00b0C favorable). Prevention: Neem oil spray" },
  { agent: "Market", color: "text-electric-blue", text: "Wheat: PKR 4,200/40kg (+3.2%). Optimal sell window: Hold 45 days \u2192 Rabi peak pricing" },
  { agent: "Advisory", color: "text-satellite-green", text: "\u2705 Advisory generated in EN + \u0627\u0631\u062f\u0648 \u2014 6 action items, overall confidence: 0.87" },
];

/* Simulated dashboard cards */
const dashCards = [
  { icon: IconCloudRain, label: "Weather", value: "22\u00b0C", sub: "Clear skies", color: "text-electric-blue", bg: "bg-electric-blue/10" },
  { icon: IconPlant, label: "Soil Health", value: "NDVI 0.72", sub: "Healthy vegetation", color: "text-satellite-green", bg: "bg-satellite-green/10" },
  { icon: IconBug, label: "Pest Risk", value: "MODERATE", sub: "Wheat Aphid", color: "text-harvest-gold", bg: "bg-harvest-gold/10" },
  { icon: IconCoin, label: "Market", value: "\u20a84,200", sub: "+3.2% trend", color: "text-electric-blue", bg: "bg-electric-blue/10" },
];

export function DashboardPreviewSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { language } = useLanguage();
  const l = (t: { en: string; ur: string }) => t[language];

  return (
    <section ref={ref} className="relative py-28 lg:py-40 overflow-hidden bg-[#07090a]">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-satellite-green/[0.04] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease }}
          className="mb-16 text-center"
        >
          <span className="mb-4 inline-block rounded-full border border-satellite-green/20 bg-satellite-green/[0.04] px-4 py-1.5 text-[13px] font-medium text-satellite-green">
            {l(translations.dashPreview.badge)}
          </span>
          <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            {l(translations.dashPreview.title)}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/70">
            {l(translations.dashPreview.subtitle)}
          </p>
        </motion.div>

        {/* Browser Mockup Frame */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ delay: 0.2, duration: 1, ease }}
          className="relative"
        >
          {/* Glow behind the frame */}
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-b from-satellite-green/[0.08] via-satellite-green/[0.02] to-transparent blur-2xl" />

          {/* Browser Frame with BorderBeam */}
          <div className="relative rounded-xl border border-white/[0.08] bg-[#0a0a0f] overflow-hidden shadow-2xl shadow-black/50">
            {/* BorderBeam — animated beam tracing the browser frame */}
            <BorderBeam
              size={200}
              duration={8}
              colorFrom="#4ade80"
              colorTo="#22d3ee"
              borderWidth={1.5}
            />
            <BorderBeam
              size={150}
              duration={8}
              delay={4}
              colorFrom="#a855f7"
              colorTo="#4ade80"
              borderWidth={1.5}
              reverse
            />

            {/* Title Bar */}
            <div className="flex items-center gap-2 border-b border-white/[0.06] bg-[#0d0d14] px-4 py-3">
              {/* Traffic lights */}
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
                <div className="h-3 w-3 rounded-full bg-[#28c840]" />
              </div>
              {/* URL bar */}
              <div className="ml-4 flex-1 flex items-center gap-2 rounded-md bg-white/[0.04] px-3 py-1">
                <IconMapPin size={12} className="text-white/30" />
                <span className="text-[12px] text-white/50 font-mono">localhost:3000/dashboard</span>
              </div>
            </div>

            {/* Content Area — Split Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-5 min-h-[420px]">
              {/* Left — Agent Terminal with AnimatedList */}
              <div className="lg:col-span-3 border-r border-white/[0.06] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <IconBrain size={14} className="text-agent-purple" />
                  <span className="text-[11px] font-mono text-white/60 uppercase tracking-wider">Agent Pipeline — Live</span>
                  <span className="ml-auto relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-satellite-green opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-satellite-green" />
                  </span>
                </div>

                {/* Terminal lines — staggered reveal */}
                <div className="flex flex-col gap-2.5">
                  {terminalLines.map((line, i) => (
                    <motion.div
                      key={line.agent}
                      initial={{ opacity: 0, x: -8 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: 0.5 + i * 0.4, duration: 0.5, ease }}
                      className="flex gap-2 font-mono text-[13px] w-full"
                    >
                      <span className={cn("shrink-0 font-semibold", line.color)}>
                        [{line.agent}]
                      </span>
                      <span className="text-white/65">{line.text}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Progress bar */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ delay: 2.5, duration: 0.5 }}
                  className="mt-5 pt-4 border-t border-white/[0.06]"
                >
                  <div className="flex items-center justify-between text-[11px] text-white/60 mb-2">
                    <span>Pipeline Progress</span>
                    <span className="text-satellite-green">100%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={isInView ? { width: "100%" } : {}}
                      transition={{ delay: 0.5, duration: 2.5, ease: "easeInOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-agent-purple via-electric-blue to-satellite-green"
                    />
                  </div>
                </motion.div>
              </div>

              {/* Right — Dashboard Cards */}
              <div className="lg:col-span-2 p-5 bg-[#08080d] relative overflow-hidden">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[11px] font-mono text-white/60 uppercase tracking-wider">Results</span>
                </div>

                <div className="grid grid-cols-2 gap-3 relative z-10">
                  {dashCards.map((card, i) => (
                    <motion.div
                      key={card.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={isInView ? { opacity: 1, scale: 1 } : {}}
                      transition={{ delay: 1.8 + i * 0.15, duration: 0.5, ease }}
                      className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3"
                    >
                      <div className={cn("mb-2 flex h-7 w-7 items-center justify-center rounded-md", card.bg)}>
                        <card.icon size={14} className={card.color} />
                      </div>
                      <p className="text-[11px] text-white/60">{card.label}</p>
                      <p className={cn("text-sm font-semibold", card.color)}>{card.value}</p>
                      <p className="text-[10px] text-white/45 mt-0.5">{card.sub}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Advisory output */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 2.8, duration: 0.5, ease }}
                  className="relative z-10 mt-3 rounded-lg border border-satellite-green/15 bg-satellite-green/[0.03] p-3"
                >
                  <p className="text-[11px] font-semibold text-satellite-green mb-1">Advisory Ready</p>
                  <p className="text-[11px] text-white/70 leading-relaxed">
                    Plant wheat by Nov 15. Apply DAP fertilizer at sowing. Monitor for aphids weekly. Hold harvest for 45 days for peak pricing.
                  </p>
                  <p className="text-[11px] text-harvest-gold/70 mt-1" dir="rtl">
                    نومبر 15 تک گندم بوئیں۔ بوائی پر DAP کھاد ڈالیں۔
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
