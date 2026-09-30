import { Router, Request, Response } from "express";
import { db } from "../db/connections.js";
import redis from "../db/redis.js";

const router = Router();

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
