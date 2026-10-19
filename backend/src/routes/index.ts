import { Router, Request, Response } from "express";
import { db } from "../db/connections.js";
import redis from "../db/redis.js";
import { query } from "../db/query.js";
import { createPropertiesRouter } from "./properties.js";
import { config } from "../config.js";
import { attachReviewPhotos } from "./review-photos.js";
import { createAgenciesRouter } from "./agencies.js";

const router = Router();
router.get("/properties/:slug/reviews", async (req, res) => {
  const reviews = await query<{ id: number } & Record<string, unknown>>(
    "SELECT r.id, r.rating, r.body, r.updated_at, u.username, u.avatar_variant, u.avatar_palette, COALESCE(u.avatar_seed, CONCAT('mountaineer-', u.user_id)) AS avatar_seed FROM reviews r JOIN properties p ON p.id = r.property_id JOIN user_profiles u ON u.user_id = r.user_id WHERE p.slug = ? AND p.status = 'published' AND r.status = 'published' ORDER BY r.updated_at DESC LIMIT 100",
    [req.params.slug],
  );
  res.json(
    await attachReviewPhotos(
      { query },
      reviews,
      new URL(config.BETTER_AUTH_URL).origin,
    ),
  );
});
router.use(
  "/properties",
  createPropertiesRouter(query, new URL(config.BETTER_AUTH_URL).origin),
);
router.use("/agencies", createAgenciesRouter(query));

router.get("/", (req: Request, res: Response) => {
  res.json({ error: false, message: "OK" });
});

router.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

router.get("/ready", async (req: Request, res: Response) => {
  try {
    await Promise.all([db.query("SELECT 1"), redis.ping()]);
    res.json({ status: "ready", mysql: "up", redis: "up" });
  } catch {
    res.status(503).json({
      status: "not_ready",
      mysql: "unknown",
      redis: "unknown",
    });
  }
});

export default router;
