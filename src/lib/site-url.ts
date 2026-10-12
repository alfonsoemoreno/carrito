const DEFAULT_SITE_URL = "https://carrito.vercel.app";

export function getPublicSiteUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : DEFAULT_SITE_URL);

  return new URL(configuredUrl);
}
