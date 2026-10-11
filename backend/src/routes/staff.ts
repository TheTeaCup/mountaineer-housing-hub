import { Router } from "express";
import type { AccountDependencies } from "./account.js";

export function createStaffRouter(deps: AccountDependencies) {
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
    const users = await deps.query<{ role: string }>(
      "SELECT role FROM users WHERE id = ?",
      [userId],
    );
    if (users[0]?.role !== "staff") {
      res.status(403).json({ message: "Staff access required." });
      return;
    }
    next();
  });
  router.get("/users", async (req, res) => {
    const page = Math.max(1, Math.min(100000, Number(req.query.page) || 1));
    const offset = (Math.floor(page) - 1) * 25;
    const rows = await deps.query(
      "SELECT u.id, u.email, u.role, u.status, u.created_at, u.last_login, p.username FROM users u LEFT JOIN user_profiles p ON p.user_id = u.id ORDER BY u.created_at DESC, u.id DESC LIMIT 25 OFFSET ?",
      [offset],
    );
    const count = await deps.query<{ total: number }>(
      "SELECT COUNT(*) AS total FROM users",
    );
    res.json({ users: rows, total: count[0]?.total ?? 0 });
  });
  router.get("/reviews", async (_req, res) => {
    res.json(
      await deps.query(
        "SELECT r.id, r.rating, r.body, r.pros, r.cons, r.recommendation, r.created_at, p.name, u.username FROM reviews r JOIN properties p ON p.id = r.property_id LEFT JOIN user_profiles u ON u.user_id = r.user_id WHERE r.status = 'pending' ORDER BY r.created_at LIMIT 100",
      ),
    );
  });
  router.patch("/reviews/:id", async (req, res) => {
    if (!["published", "rejected"].includes(req.body?.status)) {
      res.status(400).json({ message: "Choose approve or reject." });
      return;
    }
    const result = await deps.execute(
      "UPDATE reviews SET status = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ? AND status = 'pending'",
      [req.body.status, req.params.id],
    );
    if (!result.affectedRows) {
      res.status(409).json({
        message: "Submission was already reviewed or no longer exists.",
      });
      return;
    }
    res.json({ updated: true });
  });
  router.get("/apartments", async (_req, res) => {
    res.json(
      await deps.query(
        "SELECT s.id, s.name, s.address, s.website, s.information, s.submission_kind, s.property_type, s.agency_id, a.name AS agency_name, s.proposed_agency_name, s.proposed_agency_website, s.created_at, p.username FROM apartment_submissions s LEFT JOIN user_profiles p ON p.user_id = s.user_id LEFT JOIN agencies a ON a.id = s.agency_id WHERE s.status = 'pending' ORDER BY s.created_at LIMIT 100",
      ),
    );
  });
  router.patch("/apartments/:id", async (req, res) => {
    if (!["approved", "rejected"].includes(req.body?.status)) {
      res.status(400).json({ message: "Choose approve or reject." });
      return;
    }
    const result = await deps.execute(
      "UPDATE apartment_submissions SET status = ? WHERE id = ? AND status = 'pending'",
      [req.body.status, req.params.id],
    );
    if (!result.affectedRows) {
      res.status(409).json({
        message: "Submission was already reviewed or no longer exists.",
      });
      return;
    }
    res.json({ updated: true });
  });
  return router;
}
