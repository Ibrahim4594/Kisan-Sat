"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

export function AnimatedCounter({
  value,
  suffix = "",
  label,
  icon,
  delay = 0,
  className,
}: {
  value: number;
  suffix?: string;
  label: string;
  icon: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    const timeout = setTimeout(() => {
      const duration = 2000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;

      const interval = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(interval);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeout);
  }, [isInView, value, delay]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: delay / 1000, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "flex flex-col items-center gap-2 px-6 py-4",
        className
      )}
    >
      <div className="text-satellite-green/60 mb-1">{icon}</div>
      <div className="font-display text-3xl font-bold tabular-nums tracking-tight text-foreground lg:text-4xl">
        {count}
        <span className="text-satellite-green">{suffix}</span>
      </div>
      <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
    </motion.div>
  );
}
