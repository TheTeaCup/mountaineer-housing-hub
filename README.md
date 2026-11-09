# Mountaineer Housing Hub

Staff can edit existing layouts from each property's Floor plans tab. The staff
dashboard's Setup audit card counts individual missing setup details across draft
and published properties and agencies. `/staff/audit` lists each fix and links to
its editor; archived properties are excluded.

Both `/submit` forms require an explicit agreement to the Terms of Use and
acknowledgment of the Privacy Policy. The backend verifies the current versions
and stores the authenticated account's first acceptance time for each policy
version pair. Before deploying these changes to an existing database, run
`npm run db:legal` from `backend` (migration 007). New database setups include the
table automatically. Update the version constants in
`backend/src/routes/submission-terms.ts` whenever either published policy changes.
Run `npm test` from `backend` for the floor plan, audit, and consent checks.

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
