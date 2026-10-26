import { safeUrl } from "@/utils/api/properties";
import { siteUrl } from "@/utils/site-url";
import Head from "next/head";
import { useRouter } from "next/router";

type SEOProps = {
  title?: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  url?: string;
  keywords?: string[];
  noIndex?: boolean;
};

const defaultSEO = {
  title: "Mountaineer Housing Hub",
  description:
    "Find off-campus housing in Boone, NC. Compare student apartments, rental agencies, floor plans, pricing, and reviews from students near Appalachian State University.",
  image: "/assets/background.jpeg",
};

export default function SEO({
  title,
  description,
  image,
  imageAlt,
  url,
  keywords,
  noIndex,
}: SEOProps) {
  const router = useRouter();
  const seo = {
    title: title ? `${title} | ${defaultSEO.title}` : defaultSEO.title,
    description: description || defaultSEO.description,
    image: new URL(safeUrl(image, true) || defaultSEO.image, siteUrl("/")).href,
    url: url || siteUrl(router.asPath.split(/[?#]/)[0]),
  };

  return (
    <Head>
      {/* Basic */}
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />

      {/* Open Graph */}
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:image" content={seo.image} />
      <meta property="og:image:alt" content={imageAlt || defaultSEO.title} />
      <meta property="og:url" content={seo.url} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
      <meta name="twitter:image" content={seo.image} />
      <meta name="twitter:image:alt" content={imageAlt || defaultSEO.title} />

      {/* Robots */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      <meta name="viewport" content="width=device-width, initial-scale=1" />

      <meta name="keywords" content={keywords?.join(", ")} />

      <meta name="author" content="Mountaineer Housing Hub" />

      <meta name="theme-color" content="#111827" />

      <meta name="application-name" content="Mountaineer Housing Hub" />

      <meta
        name="apple-mobile-web-app-title"
        content="Mountaineer Housing Hub"
      />

      <meta property="og:type" content="website" />

      <meta property="og:site_name" content="Mountaineer Housing Hub" />

      <meta property="og:locale" content="en_US" />

      <link rel="canonical" href={seo.url} />
    </Head>
  );
}
