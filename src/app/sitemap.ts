import type { MetadataRoute } from "next";
import { getPublicSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const siteUrl = getPublicSiteUrl();

  return [
    {
      url: new URL("/", siteUrl).toString(),
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: new URL("/solicitar", siteUrl).toString(),
      lastModified,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: new URL("/auth/sign-in", siteUrl).toString(),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];
}
