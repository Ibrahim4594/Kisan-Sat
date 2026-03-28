"use client";

import { motion } from "framer-motion";
import { IconLanguage } from "@tabler/icons-react";
import { useLanguage } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <motion.button
      onClick={toggleLanguage}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1, duration: 0.5, type: "spring", stiffness: 200 }}
      className={cn(
        "fixed bottom-6 right-6 z-50",
        "flex items-center gap-2 px-4 py-2.5 rounded-full",
        "bg-white/[0.05] backdrop-blur-xl border border-white/[0.1]",
        "text-sm font-medium text-white/70",
        "hover:bg-white/[0.1] hover:border-satellite-green/30 hover:text-white",
        "transition-colors duration-300 cursor-pointer",
        "shadow-lg shadow-black/20"
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <IconLanguage className="size-4 text-satellite-green" />

      <div className="flex items-center gap-1">
        <span
          className={cn(
            "transition-colors duration-200",
            language === "en" ? "text-satellite-green" : "text-white/40"
          )}
        >
          EN
        </span>
        <span className="text-white/20">|</span>
        <span
          className={cn(
            "transition-colors duration-200",
            language === "ur" ? "text-satellite-green" : "text-white/40"
          )}
        >
          اردو
        </span>
      </div>
    </motion.button>
  );
}
