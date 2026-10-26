# Mountaineer Housing Hub

The home page requests six random published properties on each load and selects
a random photo for each card. Other property lists keep their usual ordering.

`/sitemap.xml` includes public pages, all published properties, and agencies with
published properties. `/robots.txt` advertises the sitemap. The sitemap fetches
the backend's `/sitemap` catalog and can be cached for one hour (with up to one
additional hour while revalidating).

Set `NEXT_PUBLIC_SITE_URL` before building the frontend when using a different
domain. It controls sitemap URLs, canonical links, and Open Graph page URLs;
the default is `https://mountaineer-housing-hub.theteacup.dev`.
Deploy the backend and frontend together so the random listing option and
sitemap catalog endpoint are available.

Property detail pages fetch the public listing on the server with a ten-second
timeout. Their initial HTML includes the listing, its title and description, and
an absolute photo URL for social previews. Missing listings return 404; backend
failures return a retryable 503. These pages are not cached, so publication
changes take effect on the next request. Reviews and account controls remain
interactive in the browser.

The default search description describes housing in Boone, and social previews
fall back to the existing home page background photo when no property photo is
available. Run `npm run test:seo` in `frontend` for the metadata and server-loader
checks.
