"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const PAKISTAN_CENTER: [number, number] = [30.3753, 69.3451];
const DEFAULT_ZOOM = 5;
const CITY_ZOOM = 10;

export function MapPicker({
  latitude,
  longitude,
}: {
  latitude: number | null;
  longitude: number | null;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const hasLocation = latitude !== null && longitude !== null;

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: PAKISTAN_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      boxZoom: false,
      keyboard: false,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      { maxZoom: 18 }
    ).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Sync marker and fly to location when lat/lng props change
  useEffect(() => {
    if (!mapRef.current) return;

    if (latitude === null || longitude === null) {
      // No location selected — remove marker and reset view
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      mapRef.current.setView(PAKISTAN_CENTER, DEFAULT_ZOOM);
      return;
    }

    const greenIcon = L.divIcon({
      className: "",
      html: `<div style="
        width: 16px; height: 16px;
        background: #00ff88;
        border-radius: 50%;
        border: 2px solid #050505;
        box-shadow: 0 0 12px rgba(0,255,136,0.5);
      "></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    const latlng = L.latLng(latitude, longitude);

    if (markerRef.current) {
      markerRef.current.setLatLng(latlng);
    } else {
      markerRef.current = L.marker(latlng, { icon: greenIcon }).addTo(
        mapRef.current
      );
    }

    mapRef.current.flyTo(latlng, CITY_ZOOM, {
      duration: 1.2,
    });
  }, [latitude, longitude]);

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-xl border",
        hasLocation ? "border-satellite-green/30" : "border-border"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={{
        boxShadow: isHovered
          ? "0 0 12px rgba(0,255,136,0.1)"
          : "0 0 0px rgba(0,255,136,0)",
      }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Map container */}
      <div ref={mapContainerRef} className="h-[240px] w-full" />

      {/* Overlay when no location is selected */}
      <AnimatePresence>
        {!hasLocation && (
          <motion.div
            className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-base-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="flex items-center gap-2 rounded-full glass px-4 py-2"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <svg
                className="h-3.5 w-3.5 text-[#00ff88]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2L12 6" />
                <path d="M12 18L12 22" />
                <path d="M2 12L6 12" />
                <path d="M18 12L22 12" />
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2a10 10 0 0 1 10 10" />
                <path d="M2 12a10 10 0 0 1 10-10" />
              </svg>
              <p className="text-xs text-muted-foreground">
                Select a province and city above
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
