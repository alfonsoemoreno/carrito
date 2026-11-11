import type { MetadataRoute } from "next";
import { EVENT } from "@/lib/event";
import { EVENT_BRAND } from "@/theme/event-theme";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${EVENT.name} – ${EVENT.location}`,
    short_name: EVENT.name,
    description: `${EVENT.name} en ${EVENT.location} · ${EVENT.dateLabel}.`,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: EVENT_BRAND.color,
    lang: "es-CL",
    icons: [
      {
        src: `${EVENT_BRAND.iconDirectory}/app-icon-192.png`,
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: `${EVENT_BRAND.iconDirectory}/app-icon-512.png`,
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: `${EVENT_BRAND.iconDirectory}/app-icon-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
