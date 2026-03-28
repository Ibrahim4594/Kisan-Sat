"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function AuroraBackground({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-base-black",
        className
      )}
    >
      {/* Aurora gradients */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="pointer-events-none absolute inset-0"
        >
          {/* Primary green aurora */}
          <motion.div
            animate={{
              x: [0, 30, -20, 0],
              y: [0, -40, 20, 0],
              scale: [1, 1.1, 0.95, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -top-[40%] left-[10%] h-[80%] w-[60%] rounded-full bg-satellite-green/[0.04] blur-[120px]"
          />

          {/* Electric blue aurora */}
          <motion.div
            animate={{
              x: [0, -40, 30, 0],
              y: [0, 30, -30, 0],
              scale: [1, 0.95, 1.1, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
            className="absolute -bottom-[20%] right-[5%] h-[70%] w-[50%] rounded-full bg-electric-blue/[0.03] blur-[120px]"
          />

          {/* Subtle purple accent */}
          <motion.div
            animate={{
              x: [0, 20, -30, 0],
              y: [0, -20, 30, 0],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 5,
            }}
            className="absolute top-[20%] right-[20%] h-[40%] w-[30%] rounded-full bg-agent-purple/[0.02] blur-[100px]"
          />
        </motion.div>

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />

        {/* Radial vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#050505_70%)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
