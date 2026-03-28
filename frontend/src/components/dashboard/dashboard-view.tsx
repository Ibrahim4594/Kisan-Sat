"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CropType, Province, AgentStatus, WeatherData, SoilData, Advisory } from "@/types/api";
import { InputForm } from "./input-form";
import { AgentStatusPanel } from "./agent-status-panel";
import {
  WeatherCard,
  SoilCard,
  PestCard,
  MarketCard,
  AdvisoryCard,
} from "./result-cards";
import { BlurFade } from "@/components/ui/blur-fade";
import { BorderBeam } from "@/components/ui/border-beam";
import { useLanguage } from "@/components/providers/language-provider";
import { translations } from "@/lib/translations";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

type AgentStatuses = Record<string, AgentStatus>;

interface PestRisk {
  name: string;
  risk: "low" | "moderate" | "high" | "critical";
  confidence: number;
}

interface MarketPrice {
  commodity: string;
  price: number;
  unit: string;
  change: number;
}

function getSeason(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 11 || month <= 2) return "rabi";
  if (month >= 3 && month <= 6) return "zaid";
  return "kharif";
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

export function DashboardView() {
  const { language } = useLanguage();
  const l = (t: { en: string; ur: string }) => t[language];
  // Form state
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [cropType, setCropType] = useState<CropType>("wheat");
  const [province, setProvince] = useState<Province>("punjab");

  // Pipeline state
  const [isLoading, setIsLoading] = useState(false);
  const [agentStatuses, setAgentStatuses] = useState<AgentStatuses>({});
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Result state
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [soilData, setSoilData] = useState<SoilData | null>(null);
  const [advisory, setAdvisory] = useState<Advisory | null>(null);
  const [pestData, setPestData] = useState<PestRisk[] | undefined>(undefined);
  const [marketData, setMarketData] = useState<MarketPrice[] | undefined>(undefined);

  // Track timeouts for cleanup
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  const handleLocationChange = useCallback((lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
  }, []);

  // When province changes, clear coordinates so user must pick a new city
  const handleProvinceChange = useCallback((p: Province) => {
    setProvince(p);
    setLatitude(null);
    setLongitude(null);
    setShowResults(false);
    setError(null);
  }, []);

  const runPipeline = useCallback(async () => {
    setIsLoading(true);
    setShowResults(false);
    setError(null);
    setAgentStatuses({});
    setPestData(undefined);
    setMarketData(undefined);

    // Clear any previous timeouts
    for (const t of timeoutRefs.current) clearTimeout(t);
    timeoutRefs.current = [];

    // Realistic agent status progression matching actual backend timing:
    // Wave 1 (parallel): weather + soil_crop + market — ~3s each
    // Wave 2 (depends on wave 1): pest_disease — ~7s after wave 1
    // Final: advisory (Claude API) — ~25s after pest
    // Total: ~60s
    const progression: [string, "running" | "completed", number][] = [
      // Supervisor starts immediately
      ["supervisor", "running", 300],
      ["supervisor", "completed", 1000],
      // Wave 1: parallel agents start
      ["weather", "running", 1200],
      ["soil_crop", "running", 1500],
      ["market", "running", 1800],
      // Wave 1: agents complete (~3s each)
      ["market", "completed", 4000],
      ["soil_crop", "completed", 4500],
      ["weather", "completed", 5000],
      // Wave 2: pest starts after weather+soil complete
      ["pest_disease", "running", 5500],
      ["pest_disease", "completed", 12000],
      // Advisory: starts after pest+market, Claude takes ~25s
      ["advisory", "running", 13000],
      // Advisory stays "running" — real API response will set it to "completed"
    ];

    for (const [agent, status, delay] of progression) {
      const t = setTimeout(() => {
        setAgentStatuses((prev) => ({ ...prev, [agent]: status }));
      }, delay);
      timeoutRefs.current.push(t);
    }

    try {
      // 3-minute timeout — pipeline calls multiple APIs + Claude
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 180000);

      const res = await fetch(`${BACKEND_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          location: {
            latitude: latitude ?? 30.3753,
            longitude: longitude ?? 69.3451,
            province: province,
          },
          crop: cropType,
          season: getSeason(),
          language: "en",
        }),
      });
      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`Server error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      const report = data?.report;

      // Clear simulated statuses and set real ones from response
      for (const t of timeoutRefs.current) clearTimeout(t);
      timeoutRefs.current = [];

      if (report?.agent_statuses) {
        const validStatuses = new Set(["idle", "running", "completed", "error"]);
        const finalStatuses: AgentStatuses = {};
        for (const s of report.agent_statuses) {
          const status = String(s.status).toLowerCase();
          finalStatuses[s.agent_name] = (validStatuses.has(status) ? status : "completed") as AgentStatus;
        }
        setAgentStatuses(finalStatuses);
      } else {
        // Mark all as completed if no status info
        setAgentStatuses({
          supervisor: "completed",
          weather: "completed",
          soil_crop: "completed",
          pest_disease: "completed",
          market: "completed",
          advisory: "completed",
        });
      }

      // Map weather data — backend fields: current_temp_c, current_humidity_pct, drought, flood_risk, forecast_7day
      const w = report?.weather;
      const droughtRisk = w?.drought?.risk_level ?? "low";
      const floodRisk = w?.flood_risk?.risk_level ?? "low";
      const overallWeatherRisk = droughtRisk === "critical" || floodRisk === "critical" ? "critical"
        : droughtRisk === "high" || floodRisk === "high" ? "high"
        : droughtRisk === "moderate" || floodRisk === "moderate" ? "moderate" : "low";

      // Build chart data from forecast_7day if available
      const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const forecastDays = (w?.forecast_7day ?? []).map((f: Record<string, unknown>, idx: number) => {
        const dateStr = f.date as string | undefined;
        let dayLabel: string;
        if (dateStr) {
          const dateObj = new Date(dateStr);
          dayLabel = isNaN(dateObj.getTime()) ? dayLabels[idx % 7] : dayLabels[dateObj.getDay()];
        } else {
          dayLabel = dayLabels[idx % 7];
        }
        const tempMin = (f.temp_min_c as number) ?? 0;
        const tempMax = (f.temp_max_c as number) ?? 0;
        return {
          day: dayLabel,
          temp: Math.round((tempMin + tempMax) / 2),
          humidity: (f.humidity_pct as number) ?? 0,
          rain: (f.precipitation_mm as number) ?? 0,
        };
      });

      setWeatherData({
        temperature: w?.current_temp_c ?? 32,
        humidity: w?.current_humidity_pct ?? 48,
        rainfall: w?.forecast_7day?.[0]?.precipitation_mm ?? 12,
        windSpeed: w?.forecast_7day?.[0]?.wind_speed_kmh ?? 14,
        forecast: w?.current_condition ?? w?.reasoning ?? "Weather data retrieved from NASA POWER API.",
        riskLevel: overallWeatherRisk as "low" | "moderate" | "high" | "critical",
        forecastDays: forecastDays.length > 0 ? forecastDays : undefined,
      });

      // Map soil/crop data — backend: sc.soil.moisture_pct, sc.soil.ph, sc.ndvi, sc.recommendations
      const sc = report?.soil_crop;
      setSoilData({
        nitrogen: sc?.soil?.nitrogen ?? sc?.soil?.nitrogen_ppm ?? 42,
        phosphorus: sc?.soil?.phosphorus ?? sc?.soil?.phosphorus_ppm ?? 28,
        potassium: sc?.soil?.potassium ?? sc?.soil?.potassium_ppm ?? 55,
        ph: sc?.soil?.ph ?? 6.8,
        moisture: sc?.soil?.moisture_pct ?? 38,
        organicMatter: sc?.soil?.organic_matter_pct ?? 2.1,
        ndviCurrent: sc?.ndvi?.current_ndvi ?? undefined,
        ndviHealthStatus: sc?.ndvi?.health_status ?? undefined,
      });

      // Map pest/disease data — backend: pd.pest_alerts[].pest_name, pd.disease_alerts[].disease_name
      const pd = report?.pest_disease;
      // Derive confidence from risk_level when backend does not provide a confidence field
      const riskToConfidence: Record<string, number> = { critical: 92, high: 80, moderate: 65, low: 40 };
      const pestAlerts = [
        ...(pd?.pest_alerts ?? []).map((p: Record<string, unknown>) => {
          const risk = String(p.risk_level ?? "moderate").toLowerCase();
          return {
            name: (p.pest_name ?? "Unknown") as string,
            risk: risk as PestRisk["risk"],
            confidence: (p.confidence as number) ?? (p.confidence_pct as number) ?? riskToConfidence[risk] ?? 65,
          };
        }),
        ...(pd?.disease_alerts ?? []).map((d: Record<string, unknown>) => {
          const risk = String(d.risk_level ?? "moderate").toLowerCase();
          return {
            name: (d.disease_name ?? "Unknown") as string,
            risk: risk as PestRisk["risk"],
            confidence: (d.confidence as number) ?? (d.confidence_pct as number) ?? riskToConfidence[risk] ?? 60,
          };
        }),
      ];
      // Always set real data so cards use API response
      setPestData(pestAlerts);

      // Map market data — backend fields: commodity_prices[], local_mandi_prices[]
      const m = report?.market;
      const marketPrices = (m?.commodity_prices ?? []).map((p: Record<string, unknown>) => ({
        commodity: (p.commodity ?? "Unknown") as string,
        price: (p.price_pkr_per_40kg ?? 0) as number,
        unit: "PKR/40kg" as string,
        change: (p.change_pct_30d ?? p.change_pct_7d ?? 0) as number,
      }));
      setMarketData(marketPrices);

      // Map advisory data
      const adv = report?.advisory;
      // action_items from backend are objects {action, priority, timeframe}, extract the text
      let actions: string[] = [];
      const rawActions = adv?.action_items ?? adv?.actions ?? adv?.recommendations ?? [];
      if (rawActions.length > 0) {
        actions = rawActions.map((item: string | Record<string, unknown>) =>
          typeof item === "string" ? item : (item.action as string) ?? String(item)
        );
      }
      setAdvisory({
        id: report?.query_id ?? data?.query_id ?? "adv-live",
        cropType,
        title: adv?.title ?? `${cropType.charAt(0).toUpperCase() + cropType.slice(1)} Advisory - ${province.charAt(0).toUpperCase() + province.slice(1)}`,
        titleUrdu: adv?.title_ur ?? adv?.titleUrdu ?? "فصل ایڈوائزری",
        summary: adv?.summary_en ?? adv?.summary ?? adv?.reasoning ?? `Advisory for ${cropType} at (${latitude}, ${longitude}).`,
        summaryUrdu: adv?.summary_ur ?? adv?.summaryUrdu ?? "سیٹلائٹ تجزیے کی بنیاد پر، آپ کی فصل کی ایڈوائزری۔",
        actions,
        urgency: adv?.urgency ?? "medium",
        createdAt: report?.timestamp ?? new Date().toISOString(),
      });

      setShowResults(true);
    } catch (err) {
      // Clear simulated statuses on error
      for (const t of timeoutRefs.current) clearTimeout(t);
      timeoutRefs.current = [];

      setAgentStatuses({
        supervisor: "error",
        weather: "error",
        soil_crop: "error",
        pest_disease: "error",
        market: "error",
        advisory: "error",
      });

      const msg = err instanceof Error ? err.message : String(err);
      setError(
        msg.includes("abort")
          ? "Request timed out. The pipeline is still processing — try again in a moment."
          : msg === "Failed to fetch"
            ? "Cannot connect to backend at localhost:8000. Make sure the backend server is running."
            : msg
      );
    } finally {
      setIsLoading(false);
    }
  }, [cropType, province, latitude, longitude]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Dashboard header with blur fade entrance */}
      <BlurFade delay={0.1} duration={0.5}>
        <div className="mb-8">
          {/* Breadcrumb indicator */}
          <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground/60">
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="9" />
                <rect x="14" y="3" width="7" height="5" />
                <rect x="14" y="12" width="7" height="9" />
                <rect x="3" y="16" width="7" height="5" />
              </svg>
              {l(translations.dashboard.titleLabel)}
            </span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/30">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span className="text-satellite-green/70">{l(translations.dashboard.title)}</span>
          </div>

          <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
            {l(translations.dashboard.title)} <span className="text-satellite-green">{l(translations.dashboard.titleLabel)}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {l(translations.dashboard.subtitle)}
          </p>
        </div>
      </BlurFade>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Input + Status */}
        <BlurFade delay={0.2} duration={0.5} className="lg:col-span-4">
          <div className="space-y-4">
            <InputForm
              latitude={latitude}
              longitude={longitude}
              cropType={cropType}
              province={province}
              isLoading={isLoading}
              onLocationChange={handleLocationChange}
              onCropChange={setCropType}
              onProvinceChange={handleProvinceChange}
              onSubmit={runPipeline}
            />
            <AgentStatusPanel agentStatuses={agentStatuses} />
          </div>
        </BlurFade>

        {/* Right: Results */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative flex min-h-[300px] flex-col items-center justify-center overflow-hidden rounded-xl border border-destructive/30 bg-destructive/5 p-8"
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4 text-destructive">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-sm font-medium text-destructive">Pipeline Error</p>
                <p className="mt-2 max-w-md text-center text-xs text-muted-foreground">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-4 rounded-lg border border-border bg-base-dark/50 px-4 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  Dismiss
                </button>
              </motion.div>
            ) : showResults ? (
              <motion.div
                key="results"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="grid grid-cols-1 gap-4 sm:grid-cols-2"
              >
                <WeatherCard data={weatherData} />
                <SoilCard data={soilData} />
                <PestCard pests={pestData} />
                <MarketCard prices={marketData} />
                <div className="sm:col-span-2">
                  <AdvisoryCard advisory={advisory} />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative flex min-h-[500px] flex-col items-center justify-center overflow-hidden rounded-xl border border-border/50 bg-base-dark/20"
              >
                {/* Border beam effect */}
                <BorderBeam
                  size={200}
                  duration={8}
                  colorFrom="#00ff88"
                  colorTo="#3b82f6"
                  borderWidth={1}
                />

                {/* Animated concentric rings */}
                <div className="relative mb-6 h-28 w-28">
                  <motion.div
                    className="absolute inset-0 rounded-full border border-satellite-green/10"
                    animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.1, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.div
                    className="absolute inset-4 rounded-full border border-electric-blue/10"
                    animate={{ scale: [1, 1.1, 1], opacity: [0.25, 0.08, 0.25] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                  />
                  <motion.div
                    className="absolute inset-8 rounded-full border border-satellite-green/10"
                    animate={{ scale: [1, 1.08, 1], opacity: [0.2, 0.05, 0.2] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                  />
                  {/* Center dot */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <div className="h-4 w-4 rounded-full bg-satellite-green/30" />
                      <div className="absolute inset-0 h-4 w-4 rounded-full bg-satellite-green/10 blur-md" />
                    </div>
                  </div>
                </div>

                {/* Satellite icon */}
                <div className="mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-satellite-green/40">
                    <path d="M13 7 8.7 2.7a2.41 2.41 0 0 0-3.4 0L2.7 5.3a2.41 2.41 0 0 0 0 3.4L7 13" />
                    <path d="m17 11 4.3 4.3c.94.94.94 2.46 0 3.4l-2.6 2.6c-.94.94-2.46.94-3.4 0L11 17" />
                    <path d="M8 21s-4-2-4-8 2-4 8-4" />
                    <circle cx="15" cy="9" r="1" />
                    <path d="m16 8 2-2" />
                  </svg>
                </div>

                <p className="text-sm font-medium text-muted-foreground">
                  {latitude !== null
                    ? language === "en" ? "Ready — click Get Crop Advisory" : "تیار — فصل مشاورت حاصل کریں پر کلک کریں"
                    : l(translations.dashboard.waiting)}
                </p>
                <p className="mt-1.5 max-w-xs text-center text-xs text-muted-foreground/50">
                  {latitude !== null
                    ? language === "en" ? "6 AI agents will analyze satellite data for your selected location" : "6 AI ایجنٹ آپ کے منتخب مقام کے لیے سیٹلائٹ ڈیٹا کا تجزیہ کریں گے"
                    : l(translations.dashboard.waitingSub)}
                </p>

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
