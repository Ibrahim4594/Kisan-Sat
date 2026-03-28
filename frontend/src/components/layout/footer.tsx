"use client";

import Link from "next/link";
import { IconSatellite, IconBrandGithub, IconArrowUp } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/language-provider";
import { translations } from "@/lib/translations";

const footerLinks = {
  Product: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "How It Works", href: "#about" },
    { label: "Agent Pipeline", href: "#pipeline" },
  ],
  Technology: [
    { label: "NASA POWER API", href: "#" },
    { label: "Prithvi-EO-2.0", href: "#" },
    { label: "LangGraph", href: "#" },
  ],
  Project: [
    { label: "GitHub", href: "#" },
    { label: "Team Mustaqbil", href: "#" },
    { label: "AI Mustaqbil 2.0", href: "#" },
  ],
};

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function Footer() {
  const { language } = useLanguage();
  const l = (t: { en: string; ur: string }) => t[language];

  const footerSections = [
    { title: l(translations.footer.product), links: footerLinks.Product },
    { title: l(translations.footer.technology), links: footerLinks.Technology },
    { title: l(translations.footer.project), links: footerLinks.Project },
  ];

  return (
    <footer className="relative overflow-hidden border-t border-white/[0.06]">
      {/* Top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-satellite-green/20 to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-16 lg:px-8" dir={language === "ur" ? "rtl" : undefined}>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <IconSatellite size={18} className="text-satellite-green" />
              <span className="font-display text-lg font-bold tracking-tight text-white">
                Kisan<span className="text-satellite-green">Sat</span>
              </span>
            </Link>
            <p className="text-sm text-white/45 leading-relaxed max-w-[240px]">
              {l(translations.footer.tagline)}
            </p>
            <p className="mt-3 text-sm text-harvest-gold/50" dir="rtl">
              {l(translations.footer.urduTagline)}
            </p>
          </div>

          {/* Link columns */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="text-[11px] font-mono text-white/30 uppercase tracking-[0.15em] mb-4">
                {section.title}
              </h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className={cn(
                        "text-sm text-white/55 transition-all duration-300",
                        "hover:text-satellite-green hover:drop-shadow-[0_0_6px_rgba(34,197,94,0.4)]"
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-white/40">
            {l(translations.footer.builtBy)}
          </p>
          <div className="flex items-center gap-4">
            <span className="text-[11px] text-white/30">
              {l(translations.footer.disclaimer)}
            </span>
            <a href="#" className="text-white/40 hover:text-white/60 transition-colors">
              <IconBrandGithub size={16} />
            </a>
          </div>
        </div>
      </div>

      {/* Back to top button */}
      <button
        onClick={scrollToTop}
        className={cn(
          "absolute right-6 bottom-6 z-20",
          "flex h-10 w-10 items-center justify-center rounded-full",
          "border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm",
          "text-white/40 transition-all duration-300",
          "hover:border-satellite-green/30 hover:bg-satellite-green/[0.06] hover:-translate-y-0.5",
          "hover:text-satellite-green hover:drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]"
        )}
        aria-label="Back to top"
      >
        <IconArrowUp size={16} />
      </button>
    </footer>
  );
}
