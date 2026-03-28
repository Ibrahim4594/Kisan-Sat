"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function ParticleBeam({
  direction = "horizontal",
  color = "green",
  delay = 0,
  className,
}: {
  direction?: "horizontal" | "vertical" | "diagonal-right" | "diagonal-left";
  color?: "green" | "blue" | "purple";
  delay?: number;
  className?: string;
}) {
  const colorMap = {
    green: { line: "rgba(0,255,136,0.12)", particle: "#00ff88", glow: "rgba(0,255,136,0.3)" },
    blue: { line: "rgba(59,130,246,0.12)", particle: "#3b82f6", glow: "rgba(59,130,246,0.3)" },
    purple: { line: "rgba(139,92,246,0.12)", particle: "#8b5cf6", glow: "rgba(139,92,246,0.3)" },
  };

  const c = colorMap[color];

  const isVertical = direction === "vertical";
  const isDiagRight = direction === "diagonal-right";
  const isDiagLeft = direction === "diagonal-left";

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{
        background: isVertical
          ? `linear-gradient(to bottom, transparent, ${c.line}, transparent)`
          : isDiagRight || isDiagLeft
            ? "transparent"
            : `linear-gradient(to right, transparent, ${c.line}, transparent)`,
      }}
    >
      {/* Static line */}
      {(isDiagRight || isDiagLeft) && (
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <line
            x1={isDiagLeft ? "100%" : "0%"}
            y1="0%"
            x2={isDiagLeft ? "0%" : "100%"}
            y2="100%"
            stroke={c.line}
            strokeWidth="1"
          />
        </svg>
      )}

      {/* Traveling particle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0, 1, 1, 0],
          ...(isVertical
            ? { top: ["-4px", "100%"] }
            : isDiagRight
              ? { left: ["-4px", "100%"], top: ["-4px", "100%"] }
              : isDiagLeft
                ? { right: ["-4px", "100%"], top: ["-4px", "100%"] }
                : { left: ["-4px", "100%"] }),
        }}
        transition={{
          duration: 2,
          delay,
          repeat: Infinity,
          repeatDelay: 1.5,
          ease: "easeInOut",
        }}
        className="absolute"
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: c.particle,
          boxShadow: `0 0 8px ${c.glow}, 0 0 16px ${c.glow}`,
          ...(isVertical ? { left: "50%", transform: "translateX(-50%)" } : { top: "50%", transform: "translateY(-50%)" }),
        }}
      />
    </div>
  );
}
