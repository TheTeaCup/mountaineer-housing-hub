import { API_URL } from "@/utils/api/auth";
import { siteUrl } from "@/utils/site-url";
import type { GetServerSideProps } from "next";

const publicPages = [
  "/",
  "/properties",
  "/agencies",
  "/map",
  "/legal/privacy",
  "/legal/terms",
];

const escapeXml = (value: string) =>
  value.replace(/[<>&"']/g, (character) => {
    const entities: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      '"': "&quot;",
      "'": "&apos;",
    };
    return entities[character];
  });

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  try {
    const response = await fetch(`${API_URL}/sitemap`, {
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Sitemap catalog unavailable");
    const catalog: {
      properties: { slug: string }[];
      agencies: { slug: string }[];
    } = await response.json();
    const paths = [
      ...publicPages,
      ...catalog.properties.map(
        ({ slug }) => `/properties/${encodeURIComponent(slug)}`,
      ),
      ...catalog.agencies.map(
        ({ slug }) => `/agencies/${encodeURIComponent(slug)}`,
      ),
    ];
    const urls = [...new Set(paths)].map(
      (path) => `<url><loc>${escapeXml(siteUrl(path))}</loc></url>`,
    );
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=3600",
    );
    res.end(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`,
    );
  } catch (error) {
    console.error("Unable to generate sitemap", error);
    // Ask crawlers to retry instead of caching an incomplete sitemap.
    res.statusCode = 503;
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Retry-After", "300");
    res.end("Sitemap temporarily unavailable");
  }
  return { props: {} };
};

export default function Sitemap() {
  return null;
}
