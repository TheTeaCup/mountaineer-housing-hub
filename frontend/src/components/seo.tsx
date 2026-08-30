import Head from "next/head";

type SEOProps = {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  keywords?: string[];
  noIndex?: boolean;
};

const defaultSEO = {
  title: "Mountaineer Housing Hub",
  description: "TBD",
  image: "/default-image.png",
  url: "https://mountaineer-housing-hub.teacup.workers.dev/",
};

export default function SEO({
  title,
  description,
  image,
  url,
  keywords,
  noIndex,
}: SEOProps) {
  const seo = {
    title: title ? `${title} | ${defaultSEO.title}` : defaultSEO.title,
    description: description || defaultSEO.description,
    image: image || defaultSEO.image,
    url: url || defaultSEO.url,
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
      <meta property="og:url" content={seo.url} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
      <meta name="twitter:image" content={seo.image} />

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
