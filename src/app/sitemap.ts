import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: "https://carrito.vercel.app/",
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://carrito.vercel.app/solicitar",
      lastModified,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: "https://carrito.vercel.app/auth/sign-in",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];
}
