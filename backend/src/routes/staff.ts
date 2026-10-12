import { Router } from "express";
import type { AccountDependencies } from "./account.js";
import { publishSuggestion } from "./publish-suggestion.js";
import { validateHousingSubmission } from "./housing-submission.js";

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
    if (req.body.status === "approved") {
      const result = await deps.transaction((db) =>
        publishSuggestion(db, String(req.params.id)),
      );
      if (!result) {
        res.status(409).json({
          message: "Submission was already reviewed or no longer exists.",
        });
        return;
      }
      res.json(result);
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
  router.get("/properties", async (_req, res) => {
    res.json(
      await deps.query("SELECT id, name, slug FROM properties ORDER BY name"),
    );
  });
  router.get("/properties/:id", async (req, res) => {
    const rows = await deps.query(
      "SELECT id, name, slug, address_line1 AS address, property_type, website_url AS website, description AS information, agency_id, address_line2, city, state, postal_code, latitude, longitude, phone FROM properties WHERE id = ?",
      [req.params.id],
    );
    if (!rows.length) {
      res.status(404).json({ message: "Property not found." });
      return;
    }
    res.json(rows[0]);
  });
  router.patch("/properties/:id", async (req, res) => {
    let property;
    try {
      property = validateHousingSubmission({
        ...req.body,
        submission_kind: "property",
        proposed_agency_name: null,
        proposed_agency_website: null,
      });
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
      return;
    }
    const latitude =
      req.body.latitude === "" || req.body.latitude == null
        ? null
        : Number(req.body.latitude);
    const longitude =
      req.body.longitude === "" || req.body.longitude == null
        ? null
        : Number(req.body.longitude);
    if (
      (latitude === null) !== (longitude === null) ||
      (latitude !== null &&
        (!Number.isFinite(latitude) || Math.abs(latitude) > 90)) ||
      (longitude !== null &&
        (!Number.isFinite(longitude) || Math.abs(longitude) > 180))
    ) {
      res.status(400).json({
        message:
          "Enter both coordinates: latitude from -90 to 90 and longitude from -180 to 180.",
      });
      return;
    }
    const limits = {
      address_line2: 255,
      city: 100,
      state: 2,
      postal_code: 10,
      phone: 32,
    };
    for (const [key, max] of Object.entries(limits)) {
      if (
        typeof req.body[key] !== "string" ||
        req.body[key].length > max ||
        (["city", "state"].includes(key) && !req.body[key].trim())
      ) {
        res
          .status(400)
          .json({ message: "Check the address and phone fields." });
        return;
      }
    }
    if (!/^[A-Za-z]{2}$/.test(req.body.state)) {
      res.status(400).json({ message: "Use a two-letter state code." });
      return;
    }
    if (property.agency_id) {
      const agencies = await deps.query(
        "SELECT id FROM agencies WHERE id = ?",
        [property.agency_id],
      );
      if (!agencies.length) {
        res.status(400).json({ message: "Choose an existing rental agency." });
        return;
      }
    }
    const result = await deps.execute(
      "UPDATE properties SET name = ?, address_line1 = ?, property_type = ?, website_url = ?, description = ?, agency_id = ?, address_line2 = ?, city = ?, state = ?, postal_code = ?, latitude = ?, longitude = ?, phone = ? WHERE id = ?",
      [
        property.name,
        property.address,
        property.property_type,
        property.website,
        property.information,
        property.agency_id,
        req.body.address_line2.trim() || null,
        req.body.city.trim(),
        req.body.state.toUpperCase(),
        req.body.postal_code.trim() || null,
        latitude,
        longitude,
        req.body.phone.trim() || null,
        req.params.id,
      ],
    );
    if (!result.affectedRows) {
      res.status(404).json({ message: "Property not found." });
      return;
    }
    res.json({ updated: true });
  });
  return router;
}
