import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://carrito.vercel.app"),
  title: {
    default: "Carrito",
    template: "%s | Carrito",
  },
  description:
    "Sistema de gestion de turnos para zonas de publicaciones de una congregacion.",
  applicationName: "Carrito",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Carrito",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
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
      className={`${manrope.variable} ${mono.variable}`}
    >
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
