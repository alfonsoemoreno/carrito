import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Carrito",
    short_name: "Carrito",
    description: "Sistema de gestion de turnos para zonas de publicaciones.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4efe6",
    theme_color: "#146356",
    lang: "es-CL",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
    ],
  };
}
