import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import localFont from "next/font/local";
import { AppProviders } from "@/components/providers/app-providers";
import { EVENT } from "@/lib/event";
import { ACTIVE_EVENT_THEME, EVENT_BRAND } from "@/theme/event-theme";
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
  variable: "--font-tour-sans",
  display: "swap",
});

const galibierEtroit = localFont({
  src: [
    { path: "./fonts/galibier-etroit-regular.woff", weight: "400", style: "normal" },
    { path: "./fonts/galibier-etroit-bold.woff", weight: "800", style: "normal" },
  ],
  variable: "--font-tour-condensed",
  display: "swap",
});

const brandFont = localFont({
  src: "../../scripts/assets/manrope/Manrope.ttf",
  variable: "--font-brand",
  weight: "200 800",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: getPublicSiteUrl(),
  title: {
    default: EVENT.name,
    template: `%s | ${EVENT.name}`,
  },
  description: `${EVENT.name} en ${EVENT.location} · ${EVENT.dateLabel}.`,
  applicationName: EVENT.name,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: EVENT.name,
  },
  icons: {
    icon: [{ url: `${EVENT_BRAND.iconDirectory}/event-mark.svg`, type: "image/svg+xml" }],
    apple: [{ url: `${EVENT_BRAND.iconDirectory}/apple-touch-icon.png`, sizes: "180x180", type: "image/png" }],
    shortcut: `${EVENT_BRAND.iconDirectory}/event-mark.svg`,
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
      data-event-theme={ACTIVE_EVENT_THEME}
      suppressHydrationWarning
      className={`${mono.variable} ${galibier.variable} ${galibierEtroit.variable} ${brandFont.variable}`}
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
