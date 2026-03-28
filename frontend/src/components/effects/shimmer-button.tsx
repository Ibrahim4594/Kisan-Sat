"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function ShimmerButton({
  children,
  className,
  shimmerColor = "rgba(0, 255, 136, 0.15)",
  shimmerSize = "0.1em",
  borderRadius = "9999px",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  onClick?: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "group relative inline-flex h-12 items-center justify-center overflow-hidden px-8 font-medium text-sm transition-all duration-300",
        className
      )}
      style={{ borderRadius }}
    >
      {/* Shimmer effect */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ borderRadius }}
      >
        <div className="absolute inset-[-100%] animate-[shimmer_3s_ease-in-out_infinite]">
          <div
            className="absolute inset-0"
            style={{
              background: `conic-gradient(from 0deg, transparent 0%, ${shimmerColor} 10%, transparent 20%)`,
            }}
          />
        </div>
      </div>

      {/* Border */}
      <div
        className="absolute inset-px bg-base-black transition-colors duration-300 group-hover:bg-base-dark"
        style={{ borderRadius }}
      />

      {/* Glow on hover */}
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          borderRadius,
          boxShadow: `0 0 30px ${shimmerColor}, inset 0 0 30px ${shimmerColor}`,
        }}
      />

      {/* Content */}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.button>
  );
}
