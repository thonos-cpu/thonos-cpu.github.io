import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import { AnalyticsTracker } from "@/components/analytics-tracker";
import { PerformanceInsights } from "@/components/performance-insights";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://tasis.info"),
  title: { default: "Athanasios Tasis — Software Engineer", template: "%s — Athanasios Tasis" },
  description: "Software engineer working across distributed systems, data engineering, AI/ML, scientific computing, and HPC.",
  keywords: ["Athanasios Tasis", "software engineer", "distributed systems", "data engineering", "HPC", "AI/ML"],
  authors: [{ name: "Athanasios Tasis", url: "https://github.com/thonos-cpu" }],
  creator: "Athanasios Tasis",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Athanasios Tasis — Engineering Observatory",
    description: "Reliable systems from data, algorithms, and careful engineering.",
    url: "https://tasis.info",
    siteName: "Athanasios Tasis",
    type: "website",
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#0b0e0f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const onVercel = process.env.VERCEL === "1";
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        {children}
        <AnalyticsTracker />
        <PerformanceInsights deployedOnVercel={onVercel} />
      </body>
    </html>
  );
}
