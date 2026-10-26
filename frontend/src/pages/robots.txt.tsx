import { siteUrl } from "@/utils/site-url";
import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=3600");
  res.end(
    [
      "User-agent: *",
      "Allow: /",
      "Disallow: /account",
      "Disallow: /staff",
      "Disallow: /auth",
      "Disallow: /submit",
      "Disallow: /search",
      `Sitemap: ${siteUrl("/sitemap.xml")}`,
      "",
    ].join("\n"),
  );
  return { props: {} };
};

export default function Robots() {
  return null;
}
