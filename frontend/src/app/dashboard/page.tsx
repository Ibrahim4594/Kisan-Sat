import type { Metadata } from "next";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Get AI-powered crop advisories for your farm using satellite data and multi-agent analysis.",
};

export default function DashboardPage() {
  return <DashboardView />;
}
