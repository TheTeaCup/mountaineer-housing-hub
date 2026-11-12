# Backend deployment

## Deploy the GHCR image in Coolify

The **Backend production image** workflow builds the Node 24 image on GitHub's
Linux runner. Pull requests validate the Docker build. Successful builds on
`main` publish Linux amd64 images to
`ghcr.io/theteacup/mountaineer-housing-hub-backend` with `latest` and
`sha-<commit>` tags. The workflow summary includes the immutable image digest.

1. Create a **Docker Image** application in Coolify. Use the GHCR image and the
   `latest` tag for automatic redeploys, or select a release by tag or digest.
   If the package is private, configure GHCR pull credentials with access to
   the package. Confirm the Coolify host supports Linux amd64.
2. Set **Ports Exposes** to `3000` and attach the existing API domain to the
   Coolify proxy for HTTPS. The image starts with `NODE_ENV=production` and
   `PORT=3000`. Keep the exposed port in sync if overriding `PORT`.
3. Add the backend configuration from [example.env](example.env) as **runtime**
   environment variables. Use MySQL and Redis addresses reachable from the
   container. Use service names on a shared network or private addresses.
   Loopback inside the container refers to the API container itself.
4. Preserve the existing `BETTER_AUTH_SECRET`, `AUTH_PROXY_SECRET` if configured,
   Google OAuth credentials, and R2 settings. Use the public HTTPS origins for
   `FRONTEND_URL` and `BETTER_AUTH_URL`. Configure `TRUST_PROXY` for the new
   proxy topology. If the API hostname changes, update the frontend's backend
   configuration and the Google OAuth redirect at
   `https://<api-host>/auth/callback/google`.
5. Apply pending migrations to the existing MySQL database before releasing code
   that depends on them, including
   [009_property_daily_views.sql](src/db/migrations/009_property_daily_views.sql)
   for listing analytics. The API image expects an initialized database.
6. Deploy and check the application in Coolify. The image checks `GET /ready`,
   which probes MySQL and Redis. Before switching the public API domain, verify
   readiness and a public catalog request through the new route. After switching
   the domain, verify sign-in and an image upload. Stop the legacy watcher and
   its process supervisor after verifying the cutover. Keep the prior working
   release reference for rollback.

For automatic redeploys, copy the application-specific **Deploy Webhook** into
the GitHub Actions secret `COOLIFY_DEPLOY_WEBHOOK` and store a Coolify token with
deploy permission in `COOLIFY_API_TOKEN`. The workflow sends the webhook after
publishing the image. Keep the Coolify application on `latest` for that flow.
With both secrets unset, the image is published for manual deployment. For a
rollback, disable webhook-driven redeploys while pinning the previous release.

See [Coolify Docker Image deployments](https://coolify.io/docs/applications/deployments/docker-image)
and [Coolify deploy webhooks](https://coolify.io/docs/core/automation/deploy-webhooks).

## Build from Git in Coolify

Choose the **Dockerfile** build pack with Base Directory `/backend`, Dockerfile
Location `/Dockerfile`, and Ports Exposes `3000`. Use the same runtime
configuration and health check as the image deployment. Coolify runs the image's
default command. [Coolify Dockerfile deployments](https://coolify.io/docs/applications/builds/dockerfile)

## Run with standalone Compose

From `backend/`, put the runtime variables in `.env` and set `BACKEND_IMAGE`
to the GHCR release reference. Then run:

```sh
docker compose -f compose.production.yml config --quiet
docker compose -f compose.production.yml pull
docker compose -f compose.production.yml up -d --wait --wait-timeout 120
```

Compose binds the API to host loopback on port `3001` by default. Set
`BACKEND_HOST_PORT` to change the port used by your reverse proxy.
