import type { Metadata, Viewport } from "next";
import { Manrope, Space_Mono } from "next/font/google";
import { BoothProvider } from "@/components/booth-provider";
import { CatalogProvider } from "@/components/catalog-provider";
import { brand } from "@/lib/brand";
import "./globals.css";

const sans = Manrope({ subsets: ["latin"], variable: "--font-sans" });
const mono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-mono" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: `${brand.name} — Photobooth in your browser`, template: `%s — ${brand.name}` },
  description: brand.description,
  applicationName: brand.name,
  openGraph: {
    title: brand.name,
    description: brand.description,
    type: "website"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#090909"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <div className="grain" aria-hidden="true" />
        <CatalogProvider><BoothProvider>{children}</BoothProvider></CatalogProvider>
      </body>
    </html>
  );
}
