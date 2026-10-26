# Mountaineer Housing Hub

The home page requests six random published properties on each load and selects
a random photo for each card. Other property lists keep their usual ordering.

`/sitemap.xml` includes public pages, all published properties, and agencies with
published properties. `/robots.txt` advertises the sitemap. The sitemap fetches
the backend's `/sitemap` catalog and can be cached for one hour (with up to one
additional hour while revalidating).

Set `NEXT_PUBLIC_SITE_URL` before building the frontend when using a custom
domain. It controls sitemap URLs, canonical links, and Open Graph page URLs;
the default is `https://mountaineer-housing-hub.teacup.workers.dev`.
Deploy the backend and frontend together so the random listing option and
sitemap catalog endpoint are available.
