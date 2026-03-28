import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LenisProvider } from "@/components/providers/lenis-provider";
import { LanguageProvider } from "@/components/providers/language-provider";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { LanguageToggle } from "@/components/ui/language-toggle";
import "./globals.css";

const cabinetGrotesk = localFont({
  src: [
    { path: "../fonts/CabinetGrotesk-Variable.woff2", style: "normal" },
  ],
  variable: "--font-cabinet-grotesk",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const generalSans = localFont({
  src: [
    { path: "../fonts/GeneralSans-Variable.woff2", style: "normal" },
  ],
  variable: "--font-general-sans",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#050505",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "KisanSat | AI-Powered Crop Advisory for Pakistan",
    template: "%s | KisanSat",
  },
  description:
    "Multi-agent satellite intelligence platform delivering precision agriculture advisory to Pakistani farmers. Powered by NASA Prithvi-EO-2.0 and multi-agent AI.",
  keywords: [
    "KisanSat",
    "crop advisory",
    "Pakistan agriculture",
    "satellite intelligence",
    "precision farming",
    "AI agriculture",
    "Prithvi-EO",
  ],
  authors: [{ name: "Team Mustaqbil" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cabinetGrotesk.variable} ${generalSans.variable} ${jetbrainsMono.variable} dark`}
    >
      <body className="min-h-dvh bg-base-black text-foreground antialiased">
        <TooltipProvider delay={200}>
          <LenisProvider>
            <LanguageProvider>
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
              <LanguageToggle />
            </LanguageProvider>
          </LenisProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
