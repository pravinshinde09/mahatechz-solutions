import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { headers } from "next/headers";
import { connection } from "next/server";
import { StyleNonce } from "@/components/layout/style-nonce";
import "./globals.css";

// Self-hosted at build time by next/font (no runtime third-party requests) — spec §21.3.
const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin", "latin-ext"], weight: ["600"], variable: "--font-space-grotesk", display: "swap" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], weight: ["500"], variable: "--font-jetbrains-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.WEB_APP_URL ?? "http://localhost:3000"),
  title: { default: "Mahatecz Learning — AutoCAD Electrical, Revit & electrical design courses", template: "%s · Mahatecz Learning" },
  description:
    "Affordable, industry-focused courses in AutoCAD Electrical, Revit MEP and electrical design — recorded lectures, live classes, notes and verifiable certificates.",
};

export const viewport: Viewport = {
  themeColor: "#0a1020",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Every page is rendered per request so the proxy's CSP nonce can be applied (see ADR in README).
  await connection();
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="en-IN" className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <StyleNonce nonce={nonce} />
        <a
          href="#main"
          className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
