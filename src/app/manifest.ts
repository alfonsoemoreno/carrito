import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Carrito",
    short_name: "Carrito",
    description:
      "Sistema de gestion de turnos para lugares de predicacion publica.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4efe6",
    theme_color: "#146356",
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
