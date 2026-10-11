import { Router } from "express";
import { randomUUID } from "node:crypto";
import { validateHousingSubmission } from "./housing-submission.js";

export interface AccountDependencies {
  frontendOrigin: string;
  getUser: (headers: Record<string, unknown>) => Promise<string | undefined>;
  query: <T>(sql: string, params?: unknown[]) => Promise<T[]>;
  execute: (
    sql: string,
    params?: unknown[],
  ) => Promise<{ affectedRows: number }>;
  ensureProfile: (userId: string) => Promise<string>;
  generateUsername?: () => Promise<string>;
}

export function createAccountRouter(deps: AccountDependencies) {
  const router = Router();
  router.use(async (req, res, next) => {
    if (req.method !== "GET" && req.headers.origin !== deps.frontendOrigin) {
      res.status(403).json({ message: "Request origin is not allowed." });
      return;
    }
    const userId = await deps.getUser(req.headers);
    if (!userId) {
      res.status(401).json({ message: "Please sign in." });
      return;
    }
    res.locals.userId = userId;
    next();
  });

  router.get("/", async (_req, res) => {
    const username = await deps.ensureProfile(res.locals.userId);
    const users = await deps.query<{
      role: string;
      avatar_variant: string;
      avatar_palette: string;
      avatar_seed: string | null;
    }>(
      "SELECT u.role, p.avatar_variant, p.avatar_palette, p.avatar_seed FROM users u JOIN user_profiles p ON p.user_id = u.id WHERE u.id = ?",
      [res.locals.userId],
    );
    res.json({
      username,
      role: users[0]?.role ?? "user",
      avatar_variant: users[0]?.avatar_variant ?? "beam",
      avatar_palette: users[0]?.avatar_palette ?? "gold",
      avatar_seed: users[0]?.avatar_seed ?? null,
    });
  });
  router.patch("/", async (req, res) => {
    const { avatar_variant, avatar_palette } = req.body ?? {};
    if (req.body?.username !== undefined) {
      res.status(400).json({
        message: "Usernames are generated. Use Generate new username instead.",
      });
      return;
    }
    if (
      !["beam", "marble", "bauhaus", "ring"].includes(avatar_variant) ||
      !["gold", "forest", "ocean"].includes(avatar_palette)
    ) {
      res.status(400).json({
        message: "Choose an available avatar style and color palette.",
      });
      return;
    }
    await deps.ensureProfile(res.locals.userId);
    await deps.execute(
      "UPDATE user_profiles SET avatar_variant = ?, avatar_palette = ? WHERE user_id = ?",
      [avatar_variant, avatar_palette, res.locals.userId],
    );
    res.json({ updated: true });
  });
  router.post("/username/regenerate", async (_req, res) => {
    if (!deps.generateUsername) {
      res
        .status(503)
        .json({ message: "Username generation is temporarily unavailable." });
      return;
    }
    await deps.ensureProfile(res.locals.userId);
    for (let attempt = 0; attempt < 5; attempt++) {
      const username = await deps.generateUsername();
      try {
        const result = await deps.execute(
          "UPDATE user_profiles SET username = ?, username_changed_at = CURRENT_TIMESTAMP(3) WHERE user_id = ? AND (username_changed_at IS NULL OR username_changed_at < CURRENT_TIMESTAMP(3) - INTERVAL 1 MINUTE)",
          [username, res.locals.userId],
        );
        if (!result.affectedRows) {
          res.status(429).json({
            message:
              "Please wait one minute before generating another username.",
          });
          return;
        }
        res.json({ username });
        return;
      } catch (error) {
        if ((error as { code?: string }).code === "ER_DUP_ENTRY") continue;
        throw error;
      }
    }
    res.status(503).json({
      message: "Could not generate a unique username. Please try again.",
    });
  });
  router.post("/avatar/regenerate", async (_req, res) => {
    await deps.ensureProfile(res.locals.userId);
    await deps.execute(
      "UPDATE user_profiles SET avatar_seed = ? WHERE user_id = ?",
      [randomUUID(), res.locals.userId],
    );
    res.json({ updated: true });
  });
  router.get("/favorites", async (_req, res) => {
    res.json(
      await deps.query(
        "SELECT p.slug, p.name, p.status, f.created_at FROM favorites f JOIN properties p ON p.id = f.property_id WHERE f.user_id = ? ORDER BY f.created_at DESC",
        [res.locals.userId],
      ),
    );
  });
  router.get("/properties", async (_req, res) => {
    res.json(
      await deps.query(
        "SELECT p.slug, p.name, a.name AS agency_name FROM properties p LEFT JOIN agencies a ON a.id = p.agency_id WHERE p.status = 'published' ORDER BY p.name LIMIT 500",
      ),
    );
  });
  router.get("/agencies", async (_req, res) => {
    res.json(
      await deps.query("SELECT id, name FROM agencies ORDER BY name LIMIT 500"),
    );
  });
  router.put("/favorites/:slug", async (req, res) => {
    const rows = await deps.query<{ id: number }>(
      "SELECT id FROM properties WHERE slug = ? AND status = 'published'",
      [req.params.slug],
    );
    if (!rows[0]) {
      res
        .status(404)
        .json({ message: "This apartment is not yet available to save." });
      return;
    }
    await deps.execute(
      "INSERT INTO favorites (user_id, property_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)",
      [res.locals.userId, rows[0].id],
    );
    res.json({ saved: true });
  });
  router.delete("/favorites/:slug", async (req, res) => {
    await deps.execute(
      "DELETE f FROM favorites f JOIN properties p ON p.id = f.property_id WHERE f.user_id = ? AND p.slug = ?",
      [res.locals.userId, req.params.slug],
    );
    res.json({ saved: false });
  });
  router.get("/reviews", async (_req, res) => {
    res.json(
      await deps.query(
        "SELECT r.id, r.rating, r.body, r.status, r.updated_at, p.slug, p.name FROM reviews r JOIN properties p ON p.id = r.property_id WHERE r.user_id = ? ORDER BY r.updated_at DESC",
        [res.locals.userId],
      ),
    );
  });
  router.post("/reviews", async (req, res) => {
    const { slug, rating, body, pros, cons, recommendation } = req.body ?? {};
    if (
      typeof slug !== "string" ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5 ||
      typeof body !== "string" ||
      !body.trim() ||
      body.length > 10000 ||
      (pros !== undefined &&
        (typeof pros !== "string" || pros.length > 2000)) ||
      (cons !== undefined &&
        (typeof cons !== "string" || cons.length > 2000)) ||
      !["yes", "maybe", "no", null, undefined].includes(recommendation)
    ) {
      res
        .status(400)
        .json({ message: "Enter a valid apartment, rating, and review." });
      return;
    }
    const properties = await deps.query<{ id: number }>(
      "SELECT id FROM properties WHERE slug = ? AND status = 'published'",
      [slug],
    );
    if (!properties[0]) {
      res
        .status(404)
        .json({ message: "Apartment is not available for reviews." });
      return;
    }
    try {
      await deps.execute(
        "INSERT INTO reviews (property_id, user_id, rating, body, pros, cons, recommendation) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          properties[0].id,
          res.locals.userId,
          rating,
          body.trim(),
          pros || null,
          cons || null,
          recommendation || null,
        ],
      );
      res.status(201).json({ status: "pending" });
    } catch (error) {
      if ((error as { code?: string }).code === "ER_DUP_ENTRY") {
        res.status(409).json({
          message:
            "You already reviewed this apartment. Edit it in My Account.",
        });
        return;
      }
      throw error;
    }
  });
  router.post("/apartments", async (req, res) => {
    let submission;
    try {
      submission = validateHousingSubmission(req.body ?? {});
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
      return;
    }
    if (submission.agency_id) {
      const agencies = await deps.query<{ id: number }>(
        "SELECT id FROM agencies WHERE id = ?",
        [submission.agency_id],
      );
      if (!agencies[0]) {
        res
          .status(400)
          .json({ message: "The selected rental agency no longer exists." });
        return;
      }
    }
    await deps.execute(
      "INSERT INTO apartment_submissions (user_id, submission_kind, name, address, website, information, property_type, agency_id, proposed_agency_name, proposed_agency_website) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        res.locals.userId,
        submission.submission_kind,
        submission.name,
        submission.address,
        submission.website,
        submission.information,
        submission.property_type,
        submission.agency_id,
        submission.proposed_agency_name,
        submission.proposed_agency_website,
      ],
    );
    res.status(201).json({ status: "pending" });
  });
  router.patch("/reviews/:id", async (req, res) => {
    const { rating, body } = req.body ?? {};
    if (
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5 ||
      typeof body !== "string" ||
      !body.trim() ||
      body.length > 10000
    ) {
      res.status(400).json({
        message:
          "Choose a rating from 1 to 5 and write a review of up to 10,000 characters.",
      });
      return;
    }
    const result = await deps.execute(
      "UPDATE reviews SET rating = ?, body = ?, status = 'pending', updated_at = CURRENT_TIMESTAMP(3) WHERE id = ? AND user_id = ?",
      [rating, body.trim(), req.params.id, res.locals.userId],
    );
    if (!result.affectedRows) {
      res.status(404).json({ message: "Review not found." });
      return;
    }
    res.json({ status: "pending" });
  });
  router.delete("/reviews/:id", async (req, res) => {
    const result = await deps.execute(
      "DELETE FROM reviews WHERE id = ? AND user_id = ?",
      [req.params.id, res.locals.userId],
    );
    if (!result.affectedRows) {
      res.status(404).json({ message: "Review not found." });
      return;
    }
    res.json({ deleted: true });
  });
  router.delete("/", async (req, res) => {
    if (req.body?.confirmation !== "DELETE") {
      res.status(400).json({ message: "Type DELETE to confirm." });
      return;
    }
    await deps.execute("DELETE FROM users WHERE id = ?", [res.locals.userId]);
    res.json({ deleted: true });
  });
  return router;
}
