export const SITE_URL = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ||
    "https://mountaineer-housing-hub.theteacup.dev",
).origin;

export function siteUrl(path: string) {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
