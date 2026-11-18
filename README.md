# Mountaineer Housing Hub

Staff user management supports User, Property Manager, and Staff roles, including
promotion and demotion, account suspension, individual property grants, and
agency-wide property grants. Property Manager accounts cannot submit resident
reviews.
Create non-App State accounts at `/staff/users/new`, privately share the returned
24-hour, single-use password setup link, and assign access from the user editor.
Account owners choose their own passwords. Staff can issue replacement links for
password resets. Public email signup remains disabled; student Google sign-in
still requires a verified App State email address. Suspensions and credential
resets revoke active sessions. Account email addresses remain read-only.

Agency grants apply dynamically to properties whose current `agency_id` matches
the grant. Removing an agency grant or reassigning a property's agency removes
inherited access; individual property grants remain separate. Property editors
cannot change a property's managing agency. These assignments provide the access
boundary for future agency analytics; no traffic analytics are collected yet.

Before deploying this version to an existing database, run migration 011 to add
the Property Manager role and migrate existing scoped editors. New database
setup includes the role automatically. Deploy the frontend and backend together. The staff
dashboard uses `/staff/dashboard` for pending suggestion/review counts, audit
fixes, and total agencies/users. All dashboard cards share one layout.

`/account` previews the latest five listing suggestions, with full paginated
history at `/account/submissions`. History includes pending, approved, and
rejected property and agency suggestions and is private to the submitting user.
Reviews remain separate. Run `npm test` in `backend` for authentication,
permissions, dashboard counts, and submission-history checks.

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

The home page requests six random published properties on each load, with a
Shuffle places button to refresh the selection. Listings without photos or
reviews remain eligible; cards select a random photo when available. Recently
reviewed, top rated, and sponsored sections appear separately.

Search and property browsing support monthly rent ranges (per bedroom or whole
unit), listed AppalCART routes, minimum published review counts, and minimum
average ratings. Filters persist in the URL and apply before the result limit.
Price ranges match overlapping advertised floor plan ranges and exclude unknown
prices. Route assignments do not guarantee a nearby stop or walking distance.
Deploy frontend and backend together for these filters.

Parking can be recorded as free, a monthly fee, or a one-time fee in the property
editor and filtered in search. Unverified parking remains blank and does not match
a specific parking filter. Before deploying, apply
`backend/src/db/migrations/013_property_parking.sql` to existing databases; new
database setup includes the column.

New accounts see a welcome guide explaining their generated public profile,
staff access to account email, and suggested next steps. Completion is stored
per account and the guide can be reopened in My Account. Before deploying this
feature, run `npm run db:onboarding` from `backend` to apply
`backend/src/db/migrations/014_account_onboarding.sql` to existing
databases, then deploy the backend and frontend together. The migration marks
existing profiles as complete so returning users are not interrupted. New
database setup includes the completion column.

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
