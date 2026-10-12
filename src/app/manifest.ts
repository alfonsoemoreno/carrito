import type { MetadataRoute } from "next";
import { EVENT } from "@/lib/event";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${EVENT.name} – ${EVENT.location}`,
    short_name: EVENT.name,
    description: `${EVENT.name} en ${EVENT.location}, del 26 de octubre al 1 de noviembre de 2026.`,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#f5ed00",
    lang: "es-CL",
    icons: [
      {
        src: "/icons/app-icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/app-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/app-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
