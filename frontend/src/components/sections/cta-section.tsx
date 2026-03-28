"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { IconArrowRight, IconPlayerPlay } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { LampContainer } from "@/components/ui/lamp";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { useLanguage } from "@/components/providers/language-provider";
import { translations } from "@/lib/translations";

const ease = [0.16, 1, 0.3, 1] as const;

export function CTASection() {
  const { language } = useLanguage();
  const l = (t: { en: string; ur: string }) => t[language];
  return (
    <section className="relative w-full overflow-hidden">
      <LampContainer className="min-h-screen bg-[#07090a]">
        {/* Content container — positioned in the lamp's children slot */}
        <div className="relative flex flex-col items-center text-center">
          {/* Urdu accent text */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8, ease }}
            viewport={{ once: true }}
            className="mb-6 text-lg tracking-[0.3em] text-harvest-gold/40"
            style={{ fontFamily: "system-ui" }}
          >
            {l(translations.cta.urduLine)}
          </motion.p>

          {/* Main heading */}
          <motion.h2
            initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.3, duration: 0.8, ease }}
            viewport={{ once: true }}
            className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl"
          >
            {l(translations.cta.title)}
          </motion.h2>

          {/* Glowing line under heading */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            whileInView={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 1.2, duration: 1, ease }}
            viewport={{ once: true }}
            className="mt-6 h-px w-40 bg-gradient-to-r from-transparent via-satellite-green/50 to-transparent"
          />

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 1.0, duration: 0.9, ease }}
            viewport={{ once: true }}
            className="mt-6 max-w-lg text-[17px] leading-relaxed text-white/65"
          >
            {l(translations.cta.subtitle)}
          </motion.p>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 1.3, duration: 0.9, ease }}
            viewport={{ once: true }}
            className="mt-12 flex items-center gap-5"
          >
            <Link href="/dashboard">
              <ShimmerButton
                shimmerColor="rgba(0, 255, 136, 0.4)"
                shimmerSize="0.05em"
                shimmerDuration="2.5s"
                background="rgba(0, 255, 136, 0.1)"
                borderRadius="14px"
                className="h-13 px-8 text-[15px] font-semibold text-satellite-green"
              >
                {l(translations.cta.ctaPrimary)}
                <IconArrowRight
                  size={17}
                  className="ml-2.5 transition-transform duration-300 group-hover:translate-x-1"
                />
              </ShimmerButton>
            </Link>
            <Link
              href="#demo"
              className={cn(
                "flex h-13 items-center gap-2.5 rounded-[14px] border border-white/[0.08] px-7",
                "text-[15px] font-medium text-white/50",
                "transition-all duration-300",
                "hover:border-white/[0.15] hover:bg-white/[0.03] hover:text-white/70"
              )}
            >
              <IconPlayerPlay size={15} stroke={2} />
              {l(translations.cta.ctaSecondary)}
            </Link>
          </motion.div>

          {/* Disclaimer */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 1.8, duration: 1 }}
            viewport={{ once: true }}
            className="mt-16 max-w-md text-[11px] leading-relaxed tracking-wide text-white/20"
          >
            {l(translations.cta.disclaimer)}
          </motion.p>
        </div>
      </LampContainer>

      {/* Bottom gradient divider line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-satellite-green/15 to-transparent" />
    </section>
  );
}
