"use client";

import { motion } from "framer-motion";
import {
  CloudSun,
  Sprout,
  Bug,
  TrendingUp,
  FileText,
  Thermometer,
  Droplets,
  Wind,
  AlertTriangle,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { cn } from "@/lib/utils";
import type { WeatherData, SoilData, Advisory, ForecastDay } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { BorderBeam } from "@/components/ui/border-beam";
import { NumberTicker } from "@/components/ui/number-ticker";
import { Meteors } from "@/components/ui/meteors";
import { useLanguage } from "@/components/providers/language-provider";
import { translations } from "@/lib/translations";

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

/* ── Weather Card ───────────────────────────────────────────────────── */

const defaultWeatherChart = [
  { day: "Mon", temp: 32, humidity: 45 },
  { day: "Tue", temp: 34, humidity: 42 },
  { day: "Wed", temp: 31, humidity: 55 },
  { day: "Thu", temp: 29, humidity: 62 },
  { day: "Fri", temp: 33, humidity: 48 },
  { day: "Sat", temp: 35, humidity: 40 },
  { day: "Sun", temp: 30, humidity: 58 },
];

export function WeatherCard({ data }: { data: WeatherData | null }) {
  const { language } = useLanguage();
  const l = (t: { en: string; ur: string }) => t[language];
  const d = data ?? {
    temperature: 32,
    humidity: 48,
    rainfall: 12,
    windSpeed: 14,
    forecast: "Partly cloudy with moderate heat. Low rain probability over 48 hours.",
    riskLevel: "moderate" as const,
  };

  // Use real forecast chart data when available, fall back to defaults
  const chartData: { day: string; temp: number; humidity: number }[] =
    d.forecastDays && d.forecastDays.length > 0
      ? d.forecastDays.map((f: ForecastDay) => ({ day: f.day, temp: f.temp, humidity: f.humidity }))
      : defaultWeatherChart;

  const riskColor =
    d.riskLevel === "critical" ? "text-destructive"
    : d.riskLevel === "high" ? "text-harvest-gold"
    : d.riskLevel === "moderate" ? "text-electric-blue"
    : "text-satellite-green";

  return (
    <motion.div variants={cardVariants} className="glass rounded-xl border border-border p-5 overflow-hidden relative">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CloudSun className="h-4 w-4 text-electric-blue" />
          <h3 className="text-sm font-semibold font-display text-foreground">{l(translations.dashboard.weather)}</h3>
        </div>
        <Badge variant="outline" className={cn("text-[10px]", riskColor)}>
          {d.riskLevel} risk
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 rounded-lg bg-base-dark/50 px-3 py-2">
          <Thermometer className="h-3.5 w-3.5 text-harvest-gold" />
          <div>
            <p className="text-lg font-bold font-display text-foreground">
              <NumberTicker value={d.temperature} className="text-lg font-bold font-display text-foreground" />°C
            </p>
            <p className="text-[10px] text-muted-foreground">{l(translations.dashboard.temperature)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-base-dark/50 px-3 py-2">
          <Droplets className="h-3.5 w-3.5 text-electric-blue" />
          <div>
            <p className="text-lg font-bold font-display text-foreground">
              <NumberTicker value={d.humidity} className="text-lg font-bold font-display text-foreground" />%
            </p>
            <p className="text-[10px] text-muted-foreground">{l(translations.dashboard.humidity)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-base-dark/50 px-3 py-2">
          <Droplets className="h-3.5 w-3.5 text-satellite-green" />
          <div>
            <p className="text-lg font-bold font-display text-foreground">
              <NumberTicker value={d.rainfall} className="text-lg font-bold font-display text-foreground" />mm
            </p>
            <p className="text-[10px] text-muted-foreground">{l(translations.dashboard.rainfall)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-base-dark/50 px-3 py-2">
          <Wind className="h-3.5 w-3.5 text-muted-foreground" />
          <div>
            <p className="text-lg font-bold font-display text-foreground">
              <NumberTicker value={d.windSpeed} className="text-lg font-bold font-display text-foreground" />km/h
            </p>
            <p className="text-[10px] text-muted-foreground">{l(translations.dashboard.windSpeed)}</p>
          </div>
        </div>
      </div>

      {/* Mini chart */}
      <div className="h-24">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f5a623" stopOpacity={0.3} />
                <stop offset="50%" stopColor="#f5a623" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#f5a623" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="humidGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#71717a" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "#111118", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }}
              labelStyle={{ color: "#e4e4e7" }}
            />
            <Area type="monotone" dataKey="humidity" stroke="#3b82f6" fill="url(#humidGrad)" strokeWidth={1} opacity={0.5} />
            <Area type="monotone" dataKey="temp" stroke="#f5a623" fill="url(#tempGrad)" strokeWidth={1.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-3 text-xs text-muted-foreground leading-relaxed">{d.forecast}</p>

      <BorderBeam size={60} duration={8} colorFrom="#3b82f6" colorTo="#60a5fa" borderWidth={1.5} />
    </motion.div>
  );
}

/* ── Soil / NDVI Card ───────────────────────────────────────────────── */

const defaultNdviData = [
  { month: "Jan", ndvi: 0.32 },
  { month: "Feb", ndvi: 0.38 },
  { month: "Mar", ndvi: 0.55 },
  { month: "Apr", ndvi: 0.72 },
  { month: "May", ndvi: 0.68 },
  { month: "Jun", ndvi: 0.45 },
];

export function SoilCard({ data }: { data: SoilData | null }) {
  const { language } = useLanguage();
  const l = (t: { en: string; ur: string }) => t[language];
  const d = data ?? {
    nitrogen: 42,
    phosphorus: 28,
    potassium: 55,
    ph: 6.8,
    moisture: 38,
    organicMatter: 2.1,
  };

  const nutrients = [
    { label: "N", value: d.nitrogen, max: 100, color: "#00ff88" },
    { label: "P", value: d.phosphorus, max: 100, color: "#3b82f6" },
    { label: "K", value: d.potassium, max: 100, color: "#f5a623" },
  ];

  return (
    <motion.div variants={cardVariants} className="glass rounded-xl border border-border p-5 overflow-hidden relative">
      <div className="mb-4 flex items-center gap-2">
        <Sprout className="h-4 w-4 text-satellite-green" />
        <h3 className="text-sm font-semibold font-display text-foreground">{l(translations.dashboard.soilNdvi)}</h3>
      </div>

      {/* NPK bars */}
      <div className="mb-4 space-y-2">
        {nutrients.map((n) => (
          <div key={n.label} className="flex items-center gap-3">
            <span className="w-4 text-xs font-mono font-bold text-muted-foreground">{n.label}</span>
            <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(n.value / n.max) * 100}%` }}
                transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                className="h-full rounded-full relative"
                style={{
                  background: `linear-gradient(90deg, ${n.color}88, ${n.color})`,
                  boxShadow: `0 0 8px ${n.color}66, 0 0 16px ${n.color}33`,
                }}
              />
            </div>
            <span className="w-8 text-right text-xs font-mono text-muted-foreground">{n.value}</span>
          </div>
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center rounded-lg bg-base-dark/50 py-2">
          <p className="text-sm font-bold font-display text-foreground">
            <NumberTicker value={d.ph} decimalPlaces={1} className="text-sm font-bold font-display text-foreground" />
          </p>
          <p className="text-[10px] text-muted-foreground">pH</p>
        </div>
        <div className="text-center rounded-lg bg-base-dark/50 py-2">
          <p className="text-sm font-bold font-display text-foreground">
            <NumberTicker value={d.moisture} className="text-sm font-bold font-display text-foreground" />%
          </p>
          <p className="text-[10px] text-muted-foreground">{l(translations.dashboard.moisture)}</p>
        </div>
        <div className="text-center rounded-lg bg-base-dark/50 py-2">
          <p className="text-sm font-bold font-display text-foreground">
            <NumberTicker value={d.organicMatter} decimalPlaces={1} className="text-sm font-bold font-display text-foreground" />%
          </p>
          <p className="text-[10px] text-muted-foreground">{l(translations.dashboard.organic)}</p>
        </div>
      </div>

      {/* Current NDVI indicator (from real satellite data when available) */}
      {d.ndviCurrent != null && (
        <div className="mb-3 flex items-center justify-between rounded-lg bg-base-dark/50 px-3 py-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Live NDVI</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold font-display text-satellite-green">
              <NumberTicker value={d.ndviCurrent} decimalPlaces={2} className="text-sm font-bold font-display text-satellite-green" />
            </span>
            {d.ndviHealthStatus && (
              <Badge variant="outline" className={cn(
                "text-[10px] border",
                d.ndviHealthStatus === "healthy" || d.ndviHealthStatus === "good"
                  ? "text-satellite-green border-satellite-green/20"
                  : d.ndviHealthStatus === "moderate" || d.ndviHealthStatus === "fair"
                    ? "text-electric-blue border-electric-blue/20"
                    : "text-harvest-gold border-harvest-gold/20"
              )}>
                {d.ndviHealthStatus}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* NDVI chart */}
      <p className="mb-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{l(translations.dashboard.ndviTrend)}</p>
      <div className="h-20">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={defaultNdviData}>
            <defs>
              <linearGradient id="ndviBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00ff88" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#00ff88" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#71717a" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "#111118", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }}
            />
            <Bar dataKey="ndvi" fill="url(#ndviBarGrad)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <BorderBeam size={60} duration={8} colorFrom="#00ff88" colorTo="#22c55e" borderWidth={1.5} />
    </motion.div>
  );
}

/* ── Pest & Disease Card ────────────────────────────────────────────── */

interface PestRisk {
  name: string;
  risk: "low" | "moderate" | "high" | "critical";
  confidence: number;
}

const defaultPestAlerts: PestRisk[] = [
  { name: "Wheat Rust", risk: "high", confidence: 87 },
  { name: "Aphid Infestation", risk: "moderate", confidence: 65 },
  { name: "Stem Borer", risk: "low", confidence: 34 },
];

const riskLeftBorder: Record<string, string> = {
  critical: "border-l-2 border-l-destructive",
  high: "border-l-2 border-l-harvest-gold",
  moderate: "border-l-2 border-l-electric-blue",
  low: "border-l-2 border-l-satellite-green",
};

export function PestCard({ pests }: { pests?: PestRisk[] }) {
  const { language } = useLanguage();
  const l = (t: { en: string; ur: string }) => t[language];
  const items = pests ?? defaultPestAlerts;

  const riskColors: Record<string, string> = {
    critical: "bg-destructive/10 text-destructive border-destructive/20",
    high: "bg-harvest-gold/10 text-harvest-gold border-harvest-gold/20",
    moderate: "bg-electric-blue/10 text-electric-blue border-electric-blue/20",
    low: "bg-satellite-green/10 text-satellite-green border-satellite-green/20",
  };

  return (
    <motion.div variants={cardVariants} className="glass rounded-xl border border-border p-5 overflow-hidden relative">
      <div className="mb-4 flex items-center gap-2">
        <Bug className="h-4 w-4 text-harvest-gold" />
        <h3 className="text-sm font-semibold font-display text-foreground">{l(translations.dashboard.pestDisease)}</h3>
      </div>

      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg bg-satellite-green/5 px-3 py-3 border-l-2 border-l-satellite-green">
            <CheckCircle2 className="h-3.5 w-3.5 text-satellite-green" />
            <span className="text-xs text-muted-foreground">
              {l({ en: "No pest or disease alerts detected", ur: "کوئی کیڑے یا بیماری کا خطرہ نہیں" })}
            </span>
          </div>
        ) : items.map((pest, index) => (
          <motion.div
            key={pest.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={cn(
              "flex items-center justify-between rounded-lg bg-base-dark/50 px-3 py-2.5",
              riskLeftBorder[pest.risk]
            )}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className={cn(
                "h-3.5 w-3.5",
                pest.risk === "critical" || pest.risk === "high" ? "text-harvest-gold" : "text-muted-foreground",
                (pest.risk === "critical" || pest.risk === "high") && "animate-pulse"
              )} />
              <span className="text-xs font-medium text-foreground">{pest.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-muted-foreground">
                <NumberTicker value={pest.confidence} delay={0.2 + index * 0.15} className="text-[10px] font-mono text-muted-foreground" />%
              </span>
              <Badge variant="outline" className={cn("text-[10px] border", riskColors[pest.risk])}>
                {pest.risk}
              </Badge>
            </div>
          </motion.div>
        ))}
      </div>

      <BorderBeam size={60} duration={8} colorFrom="#f5a623" colorTo="#eab308" borderWidth={1.5} />
    </motion.div>
  );
}

/* ── Market Card ────────────────────────────────────────────────────── */

interface MarketPrice {
  commodity: string;
  price: number;
  unit: string;
  change: number;
}

const defaultMarketPrices: MarketPrice[] = [
  { commodity: "Wheat", price: 4250, unit: "PKR/40kg", change: 3.2 },
  { commodity: "Rice", price: 8900, unit: "PKR/40kg", change: -1.5 },
  { commodity: "Cotton", price: 22500, unit: "PKR/40kg", change: 5.8 },
];

export function MarketCard({ prices }: { prices?: MarketPrice[] }) {
  const { language } = useLanguage();
  const l = (t: { en: string; ur: string }) => t[language];
  const items = prices ?? defaultMarketPrices;

  return (
    <motion.div variants={cardVariants} className="glass rounded-xl border border-border p-5 overflow-hidden relative">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-electric-blue" />
        <h3 className="text-sm font-semibold font-display text-foreground">{l(translations.dashboard.marketPrices)}</h3>
      </div>

      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg bg-base-dark/50 px-3 py-3">
            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground/40" />
            <span className="text-xs text-muted-foreground">
              {l({ en: "Market price data unavailable for this query", ur: "اس سوال کے لیے مارکیٹ قیمت کا ڈیٹا دستیاب نہیں" })}
            </span>
          </div>
        ) : items.map((item, index) => (
          <motion.div
            key={item.commodity}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex items-center justify-between rounded-lg bg-base-dark/50 px-3 py-2.5"
          >
            <span className="text-xs font-medium text-foreground">{item.commodity}</span>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-muted-foreground">
                <NumberTicker value={item.price} delay={0.2 + index * 0.15} className="text-xs font-mono text-muted-foreground" />{" "}
                <span className="text-[10px]">{item.unit}</span>
              </span>
              <motion.span
                initial={{ opacity: 0, y: item.change >= 0 ? 5 : -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.15 }}
                className={cn(
                  "flex items-center gap-0.5 text-[10px] font-mono font-medium",
                  item.change >= 0 ? "text-satellite-green" : "text-destructive"
                )}
              >
                {item.change >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                <NumberTicker
                  value={Math.abs(item.change)}
                  decimalPlaces={1}
                  delay={0.5 + index * 0.15}
                  className={cn(
                    "text-[10px] font-mono font-medium",
                    item.change >= 0 ? "text-satellite-green" : "text-destructive"
                  )}
                />%
              </motion.span>
            </div>
          </motion.div>
        ))}
      </div>

      <BorderBeam size={60} duration={8} colorFrom="#3b82f6" colorTo="#6366f1" borderWidth={1.5} />
    </motion.div>
  );
}

/* ── Advisory Card ──────────────────────────────────────────────────── */

export function AdvisoryCard({ advisory }: { advisory: Advisory | null }) {
  const { language } = useLanguage();
  const l = (t: { en: string; ur: string }) => t[language];
  const d = advisory ?? {
    id: "demo",
    cropType: "wheat" as const,
    title: "Wheat Crop Advisory - Irrigated Plains",
    titleUrdu: "گندم فصل ایڈوائزری - آبپاشی والے میدان",
    summary:
      "Based on current satellite data and weather patterns, moderate irrigation is recommended. Monitor for wheat rust given high humidity forecasts. Market conditions favor holding stock for 2-3 weeks.",
    summaryUrdu:
      "موجودہ سیٹلائٹ ڈیٹا اور موسمی پیٹرن کی بنیاد پر، معتدل آبپاشی کی سفارش کی جاتی ہے۔",
    actions: [
      "Reduce irrigation frequency to every 5 days",
      "Apply fungicide spray for wheat rust prevention",
      "Delay harvest by 1 week for optimal grain fill",
      "Monitor market prices — upward trend expected",
    ],
    urgency: "medium" as const,
    createdAt: new Date().toISOString(),
  };

  const urgencyColor =
    d.urgency === "critical" ? "border-destructive/30 bg-destructive/5"
    : d.urgency === "high" ? "border-harvest-gold/30 bg-harvest-gold/5"
    : d.urgency === "medium" ? "border-electric-blue/30 bg-electric-blue/5"
    : "border-satellite-green/30 bg-satellite-green/5";

  return (
    <motion.div
      variants={cardVariants}
      className={cn("glass rounded-xl border p-5 overflow-hidden relative", urgencyColor)}
      style={{
        boxShadow: "0 0 40px rgba(0, 255, 136, 0.06), 0 0 80px rgba(0, 255, 136, 0.03)",
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-satellite-green" />
          <h3 className="text-sm font-semibold font-display text-foreground">{l(translations.dashboard.cropAdvisory)}</h3>
        </div>
        <Badge variant="outline" className="text-[10px] text-satellite-green border-satellite-green/20">
          {d.cropType}
        </Badge>
      </div>

      <h4 className="text-base font-semibold font-display text-foreground">{d.title}</h4>
      <p className="mt-1 text-sm text-harvest-gold/70 font-display">{d.titleUrdu}</p>

      <p className="mt-3 text-xs text-muted-foreground leading-relaxed">{d.summary}</p>
      <p className="mt-2 text-xs text-muted-foreground/70 leading-relaxed" dir="rtl">{d.summaryUrdu}</p>

      {/* Actions */}
      {d.actions.length > 0 && (
        <div className="mt-4 space-y-1.5">
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
            {l(translations.dashboard.recommendedActions)}
          </p>
          {d.actions.map((action, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.15, ease: "easeOut" }}
              className="flex items-start gap-2"
            >
              <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-satellite-green" />
              <span className="text-xs text-foreground leading-relaxed">{action}</span>
            </motion.div>
          ))}
        </div>
      )}

      <Meteors number={8} minDuration={4} maxDuration={12} className="opacity-30" />
      <BorderBeam size={70} duration={7} colorFrom="#00ff88" colorTo="#22c55e" borderWidth={1.5} />
    </motion.div>
  );
}
