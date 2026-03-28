"use client";

import { type FormEvent, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { MapPin, Wheat, Loader2, Satellite, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { CropType, Province } from "@/types/api";
import { MagicCard } from "@/components/ui/magic-card";
import { BorderBeam } from "@/components/ui/border-beam";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { useLanguage } from "@/components/providers/language-provider";
import { translations } from "@/lib/translations";
import { PAKISTAN_LOCATIONS, type PakistanLocation } from "@/lib/pakistan-locations";

const MapPicker = dynamic(
  () => import("./map-picker").then((m) => m.MapPicker),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[240px] items-center justify-center rounded-xl border border-border bg-base-dark">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

const cropOptions: { value: CropType; label: string }[] = [
  { value: "wheat", label: "Wheat (گندم)" },
  { value: "rice", label: "Rice (چاول)" },
  { value: "cotton", label: "Cotton (کپاس)" },
  { value: "sugarcane", label: "Sugarcane (گنا)" },
  { value: "maize", label: "Maize (مکئی)" },
  { value: "mango", label: "Mango (آم)" },
  { value: "citrus", label: "Citrus (مالٹا)" },
  { value: "potato", label: "Potato (آلو)" },
  { value: "tomato", label: "Tomato (ٹماٹر)" },
  { value: "onion", label: "Onion (پیاز)" },
];

const provinceOptions: { value: Province; label: string }[] = [
  { value: "punjab", label: "Punjab (پنجاب)" },
  { value: "sindh", label: "Sindh (سندھ)" },
  { value: "kpk", label: "KPK (خیبر پختونخوا)" },
  { value: "balochistan", label: "Balochistan (بلوچستان)" },
  { value: "gilgit_baltistan", label: "Gilgit-Baltistan" },
  { value: "azad_kashmir", label: "Azad Kashmir" },
];

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
};

interface InputFormProps {
  latitude: number | null;
  longitude: number | null;
  cropType: CropType;
  province: Province;
  isLoading: boolean;
  onLocationChange: (lat: number, lng: number) => void;
  onCropChange: (crop: CropType) => void;
  onProvinceChange: (province: Province) => void;
  onSubmit: () => void;
}

export function InputForm({
  latitude,
  longitude,
  cropType,
  province,
  isLoading,
  onLocationChange,
  onCropChange,
  onProvinceChange,
  onSubmit,
}: InputFormProps) {
  const { language } = useLanguage();
  const l = (t: { en: string; ur: string }) => t[language];

  // Track the selected city name internally
  const [selectedCity, setSelectedCity] = useState<string>("");

  // Get cities for the current province
  const cities: PakistanLocation[] = PAKISTAN_LOCATIONS[province] ?? [];

  // When the province changes, reset city selection and clear coordinates
  useEffect(() => {
    setSelectedCity("");
  }, [province]);

  const handleCityChange = (cityName: string) => {
    setSelectedCity(cityName);
    const location = cities.find((c) => c.name === cityName);
    if (location) {
      onLocationChange(location.lat, location.lng);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (latitude !== null && longitude !== null) {
      onSubmit();
    }
  };

  const isReady = latitude !== null && !isLoading;

  return (
    <MagicCard
      className="rounded-xl"
      gradientSize={250}
      gradientColor="rgba(0, 255, 136, 0.05)"
      gradientFrom="#00ff88"
      gradientTo="#00cc6a"
    >
      <form
        onSubmit={handleSubmit}
        className="relative rounded-xl border border-white/[0.06] bg-[#07090a]/80 backdrop-blur-xl p-5"
      >
        {/* Border beam animates around the card */}
        <BorderBeam
          size={80}
          duration={8}
          colorFrom="#00ff88"
          colorTo="#00cc6a"
          borderWidth={1}
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {/* Header */}
          <motion.div variants={staggerItem} className="flex items-center gap-2 mb-1">
            <motion.div
              animate={isLoading ? { scale: [1, 1.2, 1], opacity: [1, 0.6, 1] } : {}}
              transition={isLoading ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : {}}
            >
              <Satellite className="h-4 w-4 text-satellite-green" />
            </motion.div>
            <h3 className="text-sm font-semibold font-display text-foreground">{l(translations.dashboard.farmLocation)}</h3>
          </motion.div>

          {/* Province */}
          <motion.div variants={staggerItem}>
            <label className="mb-1.5 block text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
              {l(translations.dashboard.province)}
            </label>
            <div className="relative">
              <select
                value={province}
                onChange={(e) => onProvinceChange(e.target.value as Province)}
                className={cn(
                  "w-full appearance-none rounded-lg border bg-base-dark/50 pl-3 pr-9 py-2.5 text-sm text-foreground outline-none",
                  "transition-all duration-300",
                  "border-white/[0.06] hover:border-white/[0.12]",
                  "focus:border-satellite-green/40 focus:ring-1 focus:ring-satellite-green/20 focus:bg-satellite-green/[0.02]"
                )}
              >
                {provinceOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#0a0c0f] text-foreground">
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-muted-foreground">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </motion.div>

          {/* City / Village */}
          <motion.div variants={staggerItem}>
            <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
              <Building2 className="h-3 w-3" />
              {l(translations.dashboard.city)}
            </label>
            <div className="relative">
              <select
                value={selectedCity}
                onChange={(e) => handleCityChange(e.target.value)}
                className={cn(
                  "w-full appearance-none rounded-lg border bg-base-dark/50 pl-3 pr-9 py-2.5 text-sm text-foreground outline-none",
                  "transition-all duration-300",
                  "border-white/[0.06] hover:border-white/[0.12]",
                  "focus:border-satellite-green/40 focus:ring-1 focus:ring-satellite-green/20 focus:bg-satellite-green/[0.02]",
                  selectedCity
                    ? "border-satellite-green/20 bg-satellite-green/[0.02]"
                    : ""
                )}
              >
                <option value="" disabled className="bg-[#0a0c0f] text-muted-foreground">
                  {l(translations.dashboard.selectCity)}
                </option>
                {cities.map((city) => (
                  <option key={city.name} value={city.name} className="bg-[#0a0c0f] text-foreground">
                    {city.name} ({city.nameUrdu})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-muted-foreground">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </motion.div>

          {/* Map — view-only, shows selected location */}
          <motion.div variants={staggerItem}>
            <MapPicker
              latitude={latitude}
              longitude={longitude}
            />
          </motion.div>

          {/* Coordinates display — telemetry style */}
          <motion.div variants={staggerItem} className="grid grid-cols-2 gap-2">
            <div
              className={cn(
                "relative rounded-lg border px-3 py-2 transition-all duration-500",
                latitude !== null
                  ? "border-satellite-green/20 bg-satellite-green/[0.03]"
                  : "border-white/[0.04] bg-base-dark/50"
              )}
            >
              <label className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
                {l(translations.dashboard.latitude)}
              </label>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-satellite-green" />
                <span
                  className={cn(
                    "text-sm font-mono font-medium tabular-nums tracking-wide transition-colors duration-300",
                    latitude !== null ? "text-satellite-green" : "text-muted-foreground"
                  )}
                >
                  {latitude !== null ? latitude.toFixed(4) : "-.----"}
                </span>
              </div>
              {latitude !== null && (
                <motion.div
                  className="absolute inset-0 rounded-lg border border-satellite-green/10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                />
              )}
            </div>
            <div
              className={cn(
                "relative rounded-lg border px-3 py-2 transition-all duration-500",
                longitude !== null
                  ? "border-electric-blue/20 bg-electric-blue/[0.03]"
                  : "border-white/[0.04] bg-base-dark/50"
              )}
            >
              <label className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
                {l(translations.dashboard.longitude)}
              </label>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-electric-blue" />
                <span
                  className={cn(
                    "text-sm font-mono font-medium tabular-nums tracking-wide transition-colors duration-300",
                    longitude !== null ? "text-electric-blue" : "text-muted-foreground"
                  )}
                >
                  {longitude !== null ? longitude.toFixed(4) : "-.----"}
                </span>
              </div>
              {longitude !== null && (
                <motion.div
                  className="absolute inset-0 rounded-lg border border-electric-blue/10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                />
              )}
            </div>
          </motion.div>

          {/* Crop type */}
          <motion.div variants={staggerItem}>
            <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
              <Wheat className="h-3 w-3" />
              {l(translations.dashboard.cropType)}
            </label>
            <div className="relative">
              <select
                value={cropType}
                onChange={(e) => onCropChange(e.target.value as CropType)}
                className={cn(
                  "w-full appearance-none rounded-lg border bg-base-dark/50 pl-3 pr-9 py-2.5 text-sm text-foreground outline-none",
                  "transition-all duration-300",
                  "border-white/[0.06] hover:border-white/[0.12]",
                  "focus:border-satellite-green/40 focus:ring-1 focus:ring-satellite-green/20 focus:bg-satellite-green/[0.02]"
                )}
              >
                {cropOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#0a0c0f] text-foreground">
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-muted-foreground">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </motion.div>

          {/* Submit */}
          <motion.div variants={staggerItem}>
            {isReady ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <ShimmerButton
                  type="submit"
                  disabled={isLoading || latitude === null}
                  shimmerColor="#00ff88"
                  shimmerSize="0.06em"
                  shimmerDuration="2.5s"
                  borderRadius="12px"
                  background="rgba(0, 255, 136, 0.06)"
                  className="h-11 w-full gap-2 text-sm font-semibold text-satellite-green shadow-[0_0_24px_rgba(0,255,136,0.08)]"
                >
                  {isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Satellite className="h-4 w-4" />
                      </motion.div>
                      {l(translations.dashboard.processing)}
                    </>
                  ) : (
                    <>
                      <Satellite className="h-4 w-4" />
                      {l(translations.dashboard.getCropAdvisory)}
                    </>
                  )}
                </ShimmerButton>
              </motion.div>
            ) : (
              <button
                type="submit"
                disabled
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] text-sm font-semibold text-muted-foreground cursor-not-allowed transition-all duration-300"
              >
                <Satellite className="h-4 w-4" />
                {l(translations.dashboard.selectLocation)}
              </button>
            )}
          </motion.div>
        </motion.div>
      </form>
    </MagicCard>
  );
}
