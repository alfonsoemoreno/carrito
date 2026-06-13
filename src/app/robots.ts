import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/solicitar", "/asignaciones", "/auth/:path*"],
        disallow: ["/admin/", "/api/", "/account/"],
      },
    ],
    sitemap: "https://carrito.vercel.app/sitemap.xml",
    host: "https://carrito.vercel.app",
  };
}
