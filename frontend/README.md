# # Mountaineer Housing Hub - Frontend

You will need a file named `.dev.vars` with the following information:

```
NEXTJS_ENV=development
```

Copy `.env.example` to `.env.local` with:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Start the backend on port 3001 as well. Google sign-in navigates to
`http://localhost:3001/auth/google/start`, shows Google's account chooser, returns through the backend Google
callback, and redirects to the frontend home page. Sessions use HTTP-only cookies;
the frontend includes credentials when checking the session and signing out.
Only verified App State Google accounts are accepted. See `backend/README.md`
for Google OAuth client setup.

The navigation lets the backend set its OAuth state cookie in a first-party
context. Deploy the frontend at `https://mountaineer-housing-hub.theteacup.dev`
and set the backend's `FRONTEND_URL` to that origin. The existing API at
`https://api-mtn-housing-hub.theteacup.dev` then shares the same site, allowing
session cookies on API requests. Use the custom domain to sign in instead of
the `workers.dev` URL.

`NEXT_PUBLIC_API_URL` is embedded into browser code during `next build`; a
Wrangler runtime variable cannot change an already-built client bundle. The
application therefore uses the public API domain for production builds and
rejects an accidentally embedded localhost URL. Local development continues
to use `http://localhost:3001`.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/pages/api-reference/create-next-app).

## Getting Started

ellie bartlett
First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/pages/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn-pages-router) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying) for more details.
