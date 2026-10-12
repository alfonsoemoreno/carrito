import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import localFont from "next/font/local";
import { AppProviders } from "@/components/providers/app-providers";
import { EVENT } from "@/lib/event";
import { getPublicSiteUrl } from "@/lib/site-url";
import "./globals.css";

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const galibier = localFont({
  src: [
    { path: "./fonts/galibier-regular.woff", weight: "400", style: "normal" },
    { path: "./fonts/galibier-bold.woff", weight: "800", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
});

const galibierEtroit = localFont({
  src: [
    { path: "./fonts/galibier-etroit-regular.woff", weight: "400", style: "normal" },
    { path: "./fonts/galibier-etroit-bold.woff", weight: "800", style: "normal" },
  ],
  variable: "--font-condensed",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: getPublicSiteUrl(),
  title: {
    default: EVENT.name,
    template: `%s | ${EVENT.name}`,
  },
  description: `${EVENT.name} en ${EVENT.location}, del 26 de octubre al 1 de noviembre de 2026.`,
  applicationName: EVENT.name,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: EVENT.name,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/app-icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${mono.variable} ${galibier.variable} ${galibierEtroit.variable}`}
    >
      <body>
        <a href="#main-content" className="skip-link">
          Saltar al contenido
        </a>
        <AppProviders>
          <div id="main-content">{children}</div>
        </AppProviders>
      </body>
    </html>
  );
}
