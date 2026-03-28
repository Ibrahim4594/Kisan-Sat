"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  CloudSun,
  Sprout,
  Bug,
  TrendingUp,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Circle,
  Check,
} from "lucide-react";
import type { AgentStatus } from "@/types/api";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/language-provider";
import { translations } from "@/lib/translations";

interface AgentStep {
  name: string;
  label: string;
  status: AgentStatus;
  icon: React.ReactNode;
}

const statusConfig: Record<
  AgentStatus,
  { icon: React.ReactNode; color: string; label: string }
> = {
  idle: {
    icon: <Circle className="h-3.5 w-3.5" />,
    color: "text-muted-foreground/40",
    label: "Waiting",
  },
  running: {
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    color: "text-electric-blue",
    label: "Running",
  },
  completed: {
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    color: "text-satellite-green",
    label: "Done",
  },
  error: {
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    color: "text-destructive",
    label: "Error",
  },
};

const defaultAgents: AgentStep[] = [
  { name: "supervisor", label: "Supervisor", status: "idle", icon: <Brain className="h-4 w-4" /> },
  { name: "weather", label: "Weather", status: "idle", icon: <CloudSun className="h-4 w-4" /> },
  { name: "soil_crop", label: "Soil & Crop", status: "idle", icon: <Sprout className="h-4 w-4" /> },
  { name: "pest_disease", label: "Pest & Disease", status: "idle", icon: <Bug className="h-4 w-4" /> },
  { name: "market", label: "Market", status: "idle", icon: <TrendingUp className="h-4 w-4" /> },
  { name: "advisory", label: "Advisory", status: "idle", icon: <FileText className="h-4 w-4" /> },
];

/** Animated checkmark for completed state */
function CompletedCheck() {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
      className="flex items-center justify-center"
    >
      <motion.div
        className="relative flex h-4 w-4 items-center justify-center rounded-full bg-satellite-green/20"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 20 }}
      >
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex items-center justify-center"
        >
          <Check className="h-3 w-3 text-satellite-green" strokeWidth={3} />
        </motion.span>
        {/* Success ring burst */}
        <motion.div
          className="absolute inset-0 rounded-full border border-satellite-green/40"
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </motion.div>
    </motion.div>
  );
}

/** Pulsing dot indicator for running agents */
function PulseDot() {
  return (
    <span className="relative flex h-2 w-2">
      <motion.span
        className="absolute inline-flex h-full w-full rounded-full bg-electric-blue opacity-75"
        animate={{ scale: [1, 1.8, 1], opacity: [0.75, 0, 0.75] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-electric-blue" />
    </span>
  );
}

/** LIVE badge with ping indicator */
function LiveBadge() {
  const { language } = useLanguage();
  const l = (t: { en: string; ur: string }) => t[language];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="flex items-center gap-1.5 rounded-full border border-satellite-green/30 bg-satellite-green/10 px-2 py-0.5"
    >
      <span className="relative flex h-1.5 w-1.5">
        <motion.span
          className="absolute inline-flex h-full w-full rounded-full bg-satellite-green"
          animate={{ scale: [1, 2, 1], opacity: [1, 0, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-satellite-green" />
      </span>
      <span className="text-[9px] font-bold uppercase tracking-widest text-satellite-green">
        {l(translations.dashboard.live)}
      </span>
    </motion.div>
  );
}

export function AgentStatusPanel({
  agentStatuses,
}: {
  agentStatuses?: Record<string, AgentStatus>;
}) {
  const { language } = useLanguage();
  const l = (t: { en: string; ur: string }) => t[language];

  const agentLabelMap: Record<string, { en: string; ur: string }> = {
    supervisor: translations.pipeline.agents.supervisor.name,
    weather: translations.dashboard.weather,
    soil_crop: translations.dashboard.soilNdvi,
    pest_disease: translations.dashboard.pestDisease,
    market: translations.dashboard.marketPrices,
    advisory: translations.dashboard.cropAdvisory,
  };

  const statusLabelMap: Record<AgentStatus, { en: string; ur: string }> = {
    idle: translations.dashboard.waiting_status,
    running: translations.dashboard.running,
    completed: translations.dashboard.done,
    error: translations.dashboard.error,
  };

  // Safely resolve statuses -- default to empty object when undefined
  const safeStatuses = agentStatuses ?? {};

  const agents = useMemo(
    () =>
      defaultAgents.map((a) => ({
        ...a,
        status: (safeStatuses[a.name] ?? "idle") as AgentStatus,
      })),
    [safeStatuses]
  );

  const completedCount = agents.filter((a) => a.status === "completed").length;
  const errorCount = agents.filter((a) => a.status === "error").length;
  const progress = agents.length > 0 ? (completedCount / agents.length) * 100 : 0;
  const isRunning = agents.some((a) => a.status === "running");
  const isActive = isRunning || completedCount > 0 || errorCount > 0;

  // Find the last non-idle agent index to size the pipeline progress line correctly.
  // We walk backwards through the agent list to find the furthest-reached agent,
  // then scale the line height proportionally to the agent list rather than using
  // a percentage of a CSS container whose pixel height we cannot predict.
  const lastActiveIndex = (() => {
    for (let i = agents.length - 1; i >= 0; i--) {
      if (agents[i].status !== "idle") return i;
    }
    return -1;
  })();
  // Height as a percentage of the full agent list span (top of first to top of last row)
  const pipelineProgress =
    lastActiveIndex > 0
      ? (lastActiveIndex / (agents.length - 1)) * 100
      : 0;

  return (
    <div className="glass rounded-xl border border-border p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h3 className="text-sm font-semibold text-foreground font-display">
            {l(translations.dashboard.agentPipeline)}
          </h3>
          <AnimatePresence>
            {isRunning && <LiveBadge key="live-badge" />}
          </AnimatePresence>
        </div>
        <span className="text-xs font-mono text-muted-foreground">
          {completedCount}/{agents.length}
        </span>
      </div>

      {/* Progress bar with glow */}
      <div className="relative mb-4">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/50">
          <motion.div
            className="relative h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, #00ff88, #00cc6a, #00ff88)",
              backgroundSize: "200% 100%",
            }}
            initial={{ width: 0 }}
            animate={{
              width: `${progress}%`,
              backgroundPosition: ["0% 0%", "200% 0%"],
            }}
            transition={{
              width: { duration: 0.5, ease: "easeOut" },
              backgroundPosition: { duration: 2, repeat: Infinity, ease: "linear" },
            }}
          />
        </div>
        {/* Glow effect under the progress bar */}
        {progress > 0 && (
          <motion.div
            className="absolute top-0 h-1.5 rounded-full blur-sm"
            style={{
              background: "linear-gradient(90deg, #00ff8866, #00cc6a66, #00ff8866)",
              backgroundSize: "200% 100%",
            }}
            initial={{ width: 0 }}
            animate={{
              width: `${progress}%`,
              backgroundPosition: ["0% 0%", "200% 0%"],
            }}
            transition={{
              width: { duration: 0.5, ease: "easeOut" },
              backgroundPosition: { duration: 2, repeat: Infinity, ease: "linear" },
            }}
          />
        )}
      </div>

      {/* Agent list with pipeline connection line */}
      <div className="relative space-y-1.5">
        {/* Vertical pipeline line */}
        <div className="absolute left-[21px] top-3 bottom-3 w-px bg-gradient-to-b from-border via-border/60 to-border/20" />
        {/* Animated pipeline progress overlay — sized by last-active agent index */}
        {isActive && (
          <motion.div
            className="absolute left-[21px] top-3 w-px"
            style={{ background: "linear-gradient(to bottom, #00ff88, #00ff8800)" }}
            initial={{ height: 0 }}
            animate={{ height: `${pipelineProgress}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        )}

        {agents.map((agent, i) => {
          const cfg = statusConfig[agent.status];
          // Resolve label here so it re-evaluates when language changes
          const label = l(agentLabelMap[agent.name] ?? { en: defaultAgents[i].label, ur: defaultAgents[i].label });
          return (
            <motion.div
              key={agent.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                agent.status === "running" && "bg-electric-blue/5 border border-electric-blue/10",
                agent.status === "completed" && "bg-satellite-green/5",
                agent.status === "error" && "bg-destructive/5"
              )}
            >
              {/* Pipeline node dot */}
              <div className="relative z-10 flex h-[10px] w-[10px] items-center justify-center">
                <motion.div
                  className={cn(
                    "h-[6px] w-[6px] rounded-full",
                    agent.status === "completed" && "bg-satellite-green",
                    agent.status === "running" && "bg-electric-blue",
                    agent.status === "error" && "bg-destructive",
                    agent.status === "idle" && "bg-muted-foreground/30"
                  )}
                  animate={
                    agent.status === "running"
                      ? { scale: [1, 1.4, 1], opacity: [1, 0.7, 1] }
                      : {}
                  }
                  transition={
                    agent.status === "running"
                      ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
                      : {}
                  }
                />
                {/* Glow ring for active node */}
                {(agent.status === "running" || agent.status === "completed") && (
                  <motion.div
                    className={cn(
                      "absolute inset-0 rounded-full",
                      agent.status === "running" && "bg-electric-blue/20",
                      agent.status === "completed" && "bg-satellite-green/20"
                    )}
                    initial={{ scale: 0 }}
                    animate={{ scale: 2.2 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </div>

              {/* Agent icon */}
              <span
                className={cn(
                  "relative z-10 transition-colors duration-300",
                  agent.status === "running" ? "text-electric-blue" : "text-muted-foreground",
                  agent.status === "completed" && "text-satellite-green",
                  agent.status === "error" && "text-destructive"
                )}
              >
                {agent.icon}
              </span>

              {/* Agent label */}
              <span className="relative z-10 flex-1 text-xs font-medium text-foreground">
                {label}
              </span>

              {/* Status indicator */}
              <span className={cn("relative z-10 flex items-center gap-1.5", cfg.color)}>
                {agent.status === "running" && <PulseDot />}
                <AnimatePresence mode="wait">
                  {agent.status === "completed" ? (
                    <CompletedCheck key="completed" />
                  ) : (
                    <motion.span
                      key={agent.status}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      {cfg.icon}
                    </motion.span>
                  )}
                </AnimatePresence>
                <span className="text-[10px] font-mono uppercase tracking-wider">
                  {l(statusLabelMap[agent.status])}
                </span>
              </span>
            </motion.div>
          );
        })}

      </div>
    </div>
  );
}
