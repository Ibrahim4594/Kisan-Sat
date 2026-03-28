"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useMotionValueEvent, useScroll } from "framer-motion";
import { Satellite, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/language-provider";
import { translations } from "@/lib/translations";

const navLinkKeys = [
  { href: "/", labelKey: "home" as const },
  { href: "/dashboard", labelKey: "dashboard" as const },
  { href: "#about", labelKey: "about" as const },
] as const;

export function Navbar() {
  const { language } = useLanguage();
  const l = (t: { en: string; ur: string }) => t[language];
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const lastScrollY = useRef(0);

  const { scrollY } = useScroll();

  const handleScroll = useCallback(() => {
    const current = scrollY.get();
    const isScrolled = current > 20;

    setScrolled(isScrolled);

    // Show/hide on scroll direction (only after scrolling past 100px)
    if (current > 100) {
      setVisible(current < lastScrollY.current || current < 20);
    } else {
      setVisible(true);
    }

    lastScrollY.current = current;
  }, [scrollY]);

  useMotionValueEvent(scrollY, "change", handleScroll);

  // Close mobile menu on resize
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{
        y: visible ? 0 : -100,
        opacity: visible ? 1 : 0,
      }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled
          ? "py-2"
          : "py-4"
      )}
    >
      {/* Glass container with border glow */}
      <div
        className={cn(
          "mx-auto max-w-5xl transition-all duration-500 rounded-2xl",
          scrolled
            ? "mx-4 lg:mx-auto bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] shadow-[0_0_1px_0_rgba(0,255,136,0.1),0_2px_20px_-2px_rgba(0,0,0,0.5)]"
            : "bg-transparent border border-transparent"
        )}
      >
        {/* Bottom glow line — appears on scroll */}
        <div
          className={cn(
            "absolute bottom-0 left-1/2 -translate-x-1/2 h-px transition-all duration-700 bg-gradient-to-r from-transparent via-satellite-green/40 to-transparent",
            scrolled ? "w-2/3 opacity-100" : "w-0 opacity-0"
          )}
        />

        <nav className="flex items-center justify-between px-5 py-2.5">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-satellite-green/20 bg-satellite-green/5 transition-all duration-300 group-hover:border-satellite-green/40 group-hover:bg-satellite-green/10 group-hover:shadow-[0_0_20px_rgba(0,255,136,0.15)]">
              <Satellite className="h-4.5 w-4.5 text-satellite-green transition-transform duration-300 group-hover:rotate-12" />
              <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-satellite-green animate-pulse" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-foreground">
              Kisan<span className="text-satellite-green">Sat</span>
            </span>
            <span className="text-xs text-harvest-gold/40 font-medium" dir="rtl">کسان سیٹ</span>
          </Link>

          {/* Desktop Nav — pill-shaped links */}
          <div className="hidden md:flex items-center gap-0.5 rounded-full bg-white/[0.03] border border-white/[0.05] px-1 py-1">
            {navLinkKeys.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-4 py-1.5 text-sm font-medium text-white/70 transition-all duration-200 hover:text-foreground rounded-full hover:bg-white/[0.06] group"
              >
                {l(translations.nav[link.labelKey])}
              </Link>
            ))}
          </div>

          {/* CTA + Mobile Toggle */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="hidden md:inline-flex rounded-full bg-satellite-green px-5 py-2 text-sm font-semibold text-black transition-all hover:bg-satellite-green/90 hover:shadow-[0_0_20px_rgba(0,255,136,0.15)]"
            >
              {l(translations.nav.getStarted)}
            </Link>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] text-muted-foreground transition-colors hover:text-foreground hover:border-satellite-green/30 backdrop-blur-sm"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden mx-4 mt-2 overflow-hidden rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/[0.06]"
          >
            <div className="flex flex-col gap-1 px-4 py-3" dir={language === "ur" ? "rtl" : undefined}>
              {navLinkKeys.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.25 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-xl px-4 py-3 text-sm font-medium text-white/70 transition-colors hover:text-foreground hover:bg-white/[0.04]"
                  >
                    {l(translations.nav[link.labelKey])}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: navLinkKeys.length * 0.05, duration: 0.25 }}
              >
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="mt-1 flex h-10 items-center justify-center rounded-full bg-satellite-green/10 border border-satellite-green/30 text-sm font-medium text-satellite-green"
                >
                  {l(translations.nav.getStarted)}
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
