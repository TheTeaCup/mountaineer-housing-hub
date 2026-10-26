import { Router } from "express";

// A lightweight catalog without the public listing endpoints' result limits.
export function createSitemapRouter(
  query: <T>(sql: string, params?: unknown[]) => Promise<T[]>,
) {
  const router = Router();
  router.get("/", async (_req, res) => {
    const [properties, agencies] = await Promise.all([
      query<{ slug: string }>(
        "SELECT slug FROM properties WHERE status = 'published' ORDER BY id",
      ),
      query<{ slug: string }>(
        "SELECT a.slug FROM agencies a WHERE EXISTS (SELECT 1 FROM properties p WHERE p.agency_id = a.id AND p.status = 'published') ORDER BY a.id",
      ),
    ]);
    res.json({ properties, agencies });
  });
  return router;
}
