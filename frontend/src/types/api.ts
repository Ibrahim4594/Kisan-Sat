import { z } from "zod/v4";

/* ── Shared Enums ───────────────────────────────────────────────────── */
export const CropTypeSchema = z.enum([
  "wheat",
  "rice",
  "cotton",
  "sugarcane",
  "maize",
  "mango",
  "citrus",
  "potato",
  "tomato",
  "onion",
]);
export type CropType = z.infer<typeof CropTypeSchema>;

export const ProvinceSchema = z.enum([
  "punjab",
  "sindh",
  "kpk",
  "balochistan",
  "gilgit_baltistan",
  "azad_kashmir",
]);
export type Province = z.infer<typeof ProvinceSchema>;

export const AgentStatusSchema = z.enum([
  "idle",
  "running",
  "completed",
  "error",
]);
export type AgentStatus = z.infer<typeof AgentStatusSchema>;

/* ── Agent Pipeline State ───────────────────────────────────────────── */
export const AgentStepSchema = z.object({
  agentName: z.string(),
  status: AgentStatusSchema,
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  message: z.string().optional(),
});
export type AgentStep = z.infer<typeof AgentStepSchema>;

/* ── Weather Forecast Day ──────────────────────────────────────────── */
export const ForecastDaySchema = z.object({
  day: z.string(),
  temp: z.number(),
  humidity: z.number(),
  rain: z.number().optional(),
});
export type ForecastDay = z.infer<typeof ForecastDaySchema>;

/* ── Weather Data ───────────────────────────────────────────────────── */
export const WeatherDataSchema = z.object({
  temperature: z.number(),
  humidity: z.number(),
  rainfall: z.number(),
  windSpeed: z.number(),
  forecast: z.string(),
  riskLevel: z.enum(["low", "moderate", "high", "critical"]),
  forecastDays: z.array(ForecastDaySchema).optional(),
});
export type WeatherData = z.infer<typeof WeatherDataSchema>;

/* ── Soil Data ──────────────────────────────────────────────────────── */
export const SoilDataSchema = z.object({
  nitrogen: z.number(),
  phosphorus: z.number(),
  potassium: z.number(),
  ph: z.number(),
  moisture: z.number(),
  organicMatter: z.number(),
  ndviCurrent: z.number().optional(),
  ndviHealthStatus: z.string().optional(),
});
export type SoilData = z.infer<typeof SoilDataSchema>;

/* ── Crop Advisory ──────────────────────────────────────────────────── */
export const AdvisorySchema = z.object({
  id: z.string(),
  cropType: CropTypeSchema,
  title: z.string(),
  titleUrdu: z.string(),
  summary: z.string(),
  summaryUrdu: z.string(),
  actions: z.array(z.string()),
  urgency: z.enum(["low", "medium", "high", "critical"]),
  createdAt: z.string().datetime(),
});
export type Advisory = z.infer<typeof AdvisorySchema>;

/* ── Advisory Request ───────────────────────────────────────────────── */
export const AdvisoryRequestSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  cropType: CropTypeSchema,
  province: ProvinceSchema,
});
export type AdvisoryRequest = z.infer<typeof AdvisoryRequestSchema>;

/* ── WebSocket Messages ─────────────────────────────────────────────── */
export const WsMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("agent_update"),
    step: AgentStepSchema,
  }),
  z.object({
    type: z.literal("advisory_result"),
    advisory: AdvisorySchema,
  }),
  z.object({
    type: z.literal("error"),
    message: z.string(),
  }),
]);
export type WsMessage = z.infer<typeof WsMessageSchema>;
