import type { MetadataRoute } from "next";
import { getPublicSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getPublicSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/solicitar", "/auth/:path*"],
        disallow: ["/admin/", "/api/", "/account/"],
      },
    ],
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
    host: siteUrl.origin,
  };
}
