import { Router } from "express";
import { randomUUID } from "node:crypto";
import {
  imageExtension,
  imageType,
  imageUpload,
} from "../middleware/image-upload.js";
import { deleteImages, uploadImage } from "../storage/images.js";
import { normalizeUsPhone } from "../utils/phone.js";
import { validateSlug } from "./catalog-slug.js";
import type { AccountDependencies } from "./account.js";
import { publishSuggestion } from "./publish-suggestion.js";
import { validatePublication } from "./publication.js";
import { validateHousingSubmission } from "./housing-submission.js";
import { attachReviewPhotos } from "./review-photos.js";
import { propertyPhotos } from "./property-photos.js";

const MAX_PROPERTY_PHOTOS = 10;

interface StaffFloorPlanRow {
  id: number;
  name: string;
  bedrooms: number;
  bathrooms: number | string;
  square_feet: number | null;
  rent_min: number | string | null;
  rent_max: number | string | null;
  rent_basis: "per_unit" | "per_bedroom";
  description: string | null;
}

function floorPlanInput(body: Record<string, unknown>) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const bedrooms = Number(body.bedrooms);
  const bathrooms = Number(body.bathrooms);
  const optionalNumber = (value: unknown) =>
    value === "" || value === null || value === undefined
      ? null
      : Number(value);
  const squareFeet = optionalNumber(body.square_feet);
  const rentMin = optionalNumber(body.rent_min);
  const rentMax = optionalNumber(body.rent_max);
  const rentBasis = body.rent_basis;
  const description =
    typeof body.description === "string" ? body.description.trim() : "";

  if (!name || name.length > 100) {
    throw new Error("Enter a floor plan name up to 100 characters.");
  }
  if (!Number.isInteger(bedrooms) || bedrooms < 0 || bedrooms > 255) {
    throw new Error("Bedrooms must be a whole number from 0 to 255.");
  }
  if (
    !Number.isFinite(bathrooms) ||
    bathrooms <= 0 ||
    bathrooms > 99.9 ||
    Math.round(bathrooms * 10) !== bathrooms * 10
  ) {
    throw new Error(
      "Bathrooms must be a positive number with one decimal place.",
    );
  }
  if (
    squareFeet !== null &&
    (!Number.isInteger(squareFeet) ||
      squareFeet <= 0 ||
      squareFeet > 4_294_967_295)
  ) {
    throw new Error("Square feet must be a positive whole number.");
  }
  for (const [label, value] of [
    ["Minimum rent", rentMin],
    ["Maximum rent", rentMax],
  ] as const) {
    if (
      value !== null &&
      (!Number.isFinite(value) || value < 0 || value > 99_999_999.99)
    ) {
      throw new Error(`${label} must be zero or greater.`);
    }
  }
  if (rentMax !== null && (rentMin === null || rentMax < rentMin)) {
    throw new Error(
      "Maximum rent must be greater than or equal to minimum rent.",
    );
  }
  if (!["per_unit", "per_bedroom"].includes(String(rentBasis))) {
    throw new Error("Choose whether rent is per unit or per bedroom.");
  }
  if (description.length > 2000) {
    throw new Error("Floor plan notes must be 2,000 characters or fewer.");
  }

  return {
    name,
    bedrooms,
    bathrooms,
    squareFeet,
    rentMin,
    rentMax,
    rentBasis: rentBasis as "per_unit" | "per_bedroom",
    description: description || null,
  };
}

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
    res.locals.userId = userId;
    if (users[0]?.role === "staff") {
      next();
      return;
    }
    const propertyMatch = req.path.match(/^\/properties\/(\d+)(?:\/|$)/);
    if (propertyMatch) {
      const assignments = await deps.query<{ user_id: number }>(
        "SELECT user_id FROM property_editors WHERE user_id = ? AND property_id = ?",
        [userId, propertyMatch[1]],
      );
      if (assignments[0]) {
        next();
        return;
      }
    }
    res
      .status(403)
      .json({ message: "Staff or assigned property access required." });
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
  router.get("/users/:id", async (req, res) => {
    const users = await deps.query(
      "SELECT u.id, u.email, u.role, u.status, u.created_at, u.last_login, p.username FROM users u LEFT JOIN user_profiles p ON p.user_id = u.id WHERE u.id = ?",
      [req.params.id],
    );
    if (!users[0]) {
      res.status(404).json({ message: "User not found." });
      return;
    }
    const [assignedProperties, properties] = await Promise.all([
      deps.query(
        "SELECT p.id, p.name, p.slug, p.status, pe.created_at AS assigned_at FROM property_editors pe JOIN properties p ON p.id = pe.property_id WHERE pe.user_id = ? ORDER BY p.name",
        [req.params.id],
      ),
      deps.query(
        "SELECT id, name, slug, status FROM properties ORDER BY name LIMIT 500",
      ),
    ]);
    res.json({ user: users[0], assignedProperties, properties });
  });
  router.put("/users/:id/properties/:propertyId", async (req, res) => {
    const users = await deps.query<{
      id: number;
      role: string;
      status: string;
    }>("SELECT id, role, status FROM users WHERE id = ?", [req.params.id]);
    if (!users[0]) {
      res.status(404).json({ message: "User not found." });
      return;
    }
    if (users[0].status !== "active") {
      res
        .status(400)
        .json({ message: "Only active users can edit properties." });
      return;
    }
    if (users[0].role === "staff") {
      res.status(400).json({
        message: "Staff members already have access to every property.",
      });
      return;
    }
    const properties = await deps.query<{ id: number }>(
      "SELECT id FROM properties WHERE id = ?",
      [req.params.propertyId],
    );
    if (!properties[0]) {
      res.status(404).json({ message: "Property not found." });
      return;
    }
    await deps.execute(
      "INSERT INTO property_editors (user_id, property_id, assigned_by) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE assigned_by = VALUES(assigned_by)",
      [req.params.id, req.params.propertyId, res.locals.userId],
    );
    res.status(201).json({ assigned: true });
  });
  router.delete("/users/:id/properties/:propertyId", async (req, res) => {
    const result = await deps.execute(
      "DELETE FROM property_editors WHERE user_id = ? AND property_id = ?",
      [req.params.id, req.params.propertyId],
    );
    if (!result.affectedRows) {
      res
        .status(404)
        .json({ message: "This property is not assigned to the user." });
      return;
    }
    res.json({ assigned: false });
  });
  router.get("/reviews", async (_req, res) => {
    const reviews = await deps.query<{ id: number } & Record<string, unknown>>(
      "SELECT r.id, r.rating, r.body, r.pros, r.cons, r.recommendation, r.created_at, p.name, u.username FROM reviews r JOIN properties p ON p.id = r.property_id LEFT JOIN user_profiles u ON u.user_id = r.user_id WHERE r.status = 'pending' ORDER BY r.created_at LIMIT 100",
    );
    res.json(await attachReviewPhotos(deps, reviews, deps.backendOrigin));
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
  router.get("/agencies", async (_req, res) => {
    res.json(
      await deps.query(
        `SELECT a.id, a.name, a.slug, a.website_url AS website, a.phone, a.email,
         a.description AS information, a.updated_at,
         COUNT(p.id) AS property_count,
         COUNT(CASE WHEN p.status = 'published' THEN 1 END) AS published_property_count
         FROM agencies a
         LEFT JOIN properties p ON p.agency_id = a.id
         GROUP BY a.id, a.name, a.slug, a.website_url, a.phone, a.email, a.description, a.updated_at
         ORDER BY a.name LIMIT 500`,
      ),
    );
  });
  router.get("/agencies/:id", async (req, res) => {
    const rows = await deps.query(
      "SELECT id, name, slug, website_url AS website, phone, email, description AS information FROM agencies WHERE id = ?",
      [req.params.id],
    );
    if (!rows.length) {
      res.status(404).json({ message: "Rental agency not found." });
      return;
    }
    res.json(rows[0]);
  });
  router.patch("/agencies/:id", async (req, res) => {
    const { name, website, information, email } = req.body ?? {};
    let slug: string;
    let phone: string | null;
    try {
      slug = validateSlug(req.body?.slug);
      phone = normalizeUsPhone(req.body?.phone);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
      return;
    }
    if (typeof name !== "string" || !name.trim() || name.length > 255) {
      res.status(400).json({ message: "Enter a rental agency name." });
      return;
    }
    let websiteValue: string | null = null;
    if (website !== undefined && website !== null && website !== "") {
      if (typeof website !== "string" || website.length > 2048) {
        res.status(400).json({ message: "Enter a valid agency website." });
        return;
      }
      try {
        const parsed = new URL(website);
        if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
        websiteValue = parsed.href;
      } catch {
        res
          .status(400)
          .json({ message: "Enter a valid http or https website." });
        return;
      }
    }
    const description =
      typeof information === "string" && information.length <= 10000
        ? information.trim() || null
        : undefined;
    if (description === undefined) {
      res.status(400).json({ message: "Description is too long." });
      return;
    }
    const emailValue =
      typeof email === "string" && email.trim() ? email.trim() : null;
    if (
      emailValue &&
      (emailValue.length > 255 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue))
    ) {
      res.status(400).json({ message: "Enter a valid email address." });
      return;
    }
    const duplicates = await deps.query(
      "SELECT id FROM agencies WHERE slug = ? AND id <> ?",
      [slug, req.params.id],
    );
    if (duplicates.length) {
      res
        .status(409)
        .json({ message: "This agency URL slug is already in use." });
      return;
    }
    const result = await deps.execute(
      "UPDATE agencies SET name = ?, slug = ?, website_url = ?, phone = ?, email = ?, description = ? WHERE id = ?",
      [
        name.trim(),
        slug,
        websiteValue,
        phone,
        emailValue,
        description,
        req.params.id,
      ],
    );
    if (!result.affectedRows) {
      res.status(404).json({ message: "Rental agency not found." });
      return;
    }
    res.json({ updated: true });
  });
  router.get("/apartments/:id", async (req, res) => {
    const rows = await deps.query(
      "SELECT * FROM apartment_submissions WHERE id = ? AND status = 'pending'",
      [req.params.id],
    );
    if (!rows.length) {
      res.status(404).json({
        message: "This suggestion was already reviewed or no longer exists.",
      });
      return;
    }
    res.json(rows[0]);
  });
  router.patch("/apartments/:id", async (req, res) => {
    if (!["approved", "rejected"].includes(req.body?.status)) {
      res.status(400).json({ message: "Choose approve or reject." });
      return;
    }
    if (req.body.status === "approved") {
      const edits = req.body.edits;
      if (edits !== undefined) {
        try {
          validatePublication(edits);
          if (edits.slug !== undefined) validateSlug(edits.slug);
        } catch (error) {
          res.status(400).json({ message: (error as Error).message });
          return;
        }
        if (edits.agency_id) {
          const agencies = await deps.query(
            "SELECT id FROM agencies WHERE id = ?",
            [edits.agency_id],
          );
          if (!agencies.length) {
            res.status(400).json({ message: "Choose an existing agency." });
            return;
          }
        }
      }
      let result;
      try {
        result = await deps.transaction((db) =>
          publishSuggestion(db, String(req.params.id), edits),
        );
      } catch (error) {
        if (
          (error as { code?: string }).code === "ER_DUP_ENTRY" ||
          (error as Error).message.includes("URL slug")
        ) {
          res.status(409).json({
            message: "This URL slug is already in use. Choose another slug.",
          });
          return;
        }
        throw error;
      }
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
      await deps.query(
        "SELECT p.id, p.name, p.slug, p.status, p.address_line1 AS address, a.name AS agency_name FROM properties p LEFT JOIN agencies a ON a.id = p.agency_id ORDER BY p.name LIMIT 500",
      ),
    );
  });
  router.get("/properties/:id", async (req, res) => {
    const rows = await deps.query<{ id: number } & Record<string, unknown>>(
      "SELECT id, name, slug, address_line1 AS address, property_type, website_url AS website, description AS information, agency_id, address_line2, city, state, postal_code, latitude, longitude, phone FROM properties WHERE id = ?",
      [req.params.id],
    );
    if (!rows.length) {
      res.status(404).json({ message: "Property not found." });
      return;
    }
    const [photos, floorPlans] = await Promise.all([
      propertyPhotos(deps, rows[0].id, deps.backendOrigin),
      deps.query<StaffFloorPlanRow>(
        "SELECT id, name, bedrooms, bathrooms, square_feet, rent_min, rent_max, rent_basis, description FROM floor_plans WHERE property_id = ? ORDER BY bedrooms, name",
        [rows[0].id],
      ),
    ]);
    res.json({
      ...rows[0],
      photos,
      floor_plans: floorPlans.map((plan) => ({
        ...plan,
        bathrooms: Number(plan.bathrooms),
        rent_min: plan.rent_min === null ? null : Number(plan.rent_min),
        rent_max: plan.rent_max === null ? null : Number(plan.rent_max),
      })),
    });
  });
  router.post("/properties/:id/floor-plans", async (req, res) => {
    const propertyId = Number(req.params.id);
    if (!Number.isInteger(propertyId) || propertyId < 1) {
      res.status(400).json({ message: "Choose a valid property." });
      return;
    }
    const properties = await deps.query<{ id: number }>(
      "SELECT id FROM properties WHERE id = ?",
      [propertyId],
    );
    if (!properties[0]) {
      res.status(404).json({ message: "Property not found." });
      return;
    }
    let plan;
    try {
      plan = floorPlanInput(req.body ?? {});
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
      return;
    }
    try {
      await deps.execute(
        "INSERT INTO floor_plans (property_id, name, bedrooms, bathrooms, square_feet, rent_min, rent_max, rent_basis, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          propertyId,
          plan.name,
          plan.bedrooms,
          plan.bathrooms,
          plan.squareFeet,
          plan.rentMin,
          plan.rentMax,
          plan.rentBasis,
          plan.description,
        ],
      );
    } catch (error) {
      if ((error as { code?: string }).code === "ER_DUP_ENTRY") {
        res.status(409).json({
          message:
            "A floor plan with this name already exists for the property.",
        });
        return;
      }
      throw error;
    }
    await deps.execute(
      "UPDATE properties SET updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?",
      [propertyId],
    );
    const floorPlans = await deps.query<StaffFloorPlanRow>(
      "SELECT id, name, bedrooms, bathrooms, square_feet, rent_min, rent_max, rent_basis, description FROM floor_plans WHERE property_id = ? ORDER BY bedrooms, name",
      [propertyId],
    );
    res.status(201).json({
      floor_plans: floorPlans.map((item) => ({
        ...item,
        bathrooms: Number(item.bathrooms),
        rent_min: item.rent_min === null ? null : Number(item.rent_min),
        rent_max: item.rent_max === null ? null : Number(item.rent_max),
      })),
    });
  });
  router.delete(
    "/properties/:id/floor-plans/:floorPlanId",
    async (req, res) => {
      const result = await deps.execute(
        "DELETE FROM floor_plans WHERE id = ? AND property_id = ?",
        [req.params.floorPlanId, req.params.id],
      );
      if (!result.affectedRows) {
        res.status(404).json({ message: "Floor plan not found." });
        return;
      }
      await deps.execute(
        "UPDATE properties SET updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?",
        [req.params.id],
      );
      res.json({ deleted: true });
    },
  );
  router.post(
    "/properties/:id/photos",
    imageUpload("photos", MAX_PROPERTY_PHOTOS),
    async (req, res) => {
      const propertyId = Number(req.params.id);
      const files = (req.files as Express.Multer.File[] | undefined) ?? [];
      if (!Number.isInteger(propertyId) || propertyId < 1 || !files.length) {
        res.status(400).json({ message: "Choose at least one photo." });
        return;
      }
      const properties = await deps.query<{ id: number; name: string }>(
        "SELECT id, name FROM properties WHERE id = ?",
        [propertyId],
      );
      if (!properties[0]) {
        res.status(404).json({ message: "Property not found." });
        return;
      }
      const counts = await deps.query<{ total: number; next_order: number }>(
        "SELECT COUNT(*) AS total, COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM property_photos WHERE property_id = ?",
        [propertyId],
      );
      const currentCount = Number(counts[0]?.total ?? 0);
      if (currentCount + files.length > MAX_PROPERTY_PHOTOS) {
        res.status(400).json({
          message: `A property can have up to ${MAX_PROPERTY_PHOTOS} photos.`,
        });
        return;
      }
      const types = files.map((file) => imageType(file.buffer));
      if (types.some((type) => type === null)) {
        res.status(400).json({
          message: "Photos must be JPEG, PNG, or WebP images.",
        });
        return;
      }

      const uploadedKeys: string[] = [];
      const insertedIds: number[] = [];
      try {
        const startOrder = Number(counts[0]?.next_order ?? 0);
        for (let index = 0; index < files.length; index++) {
          const contentType = types[index]!;
          const key = `property-photos/${propertyId}/${randomUUID()}.${imageExtension(contentType)}`;
          await uploadImage(key, files[index].buffer, contentType);
          uploadedKeys.push(key);
          const result = await deps.execute(
            "INSERT INTO property_photos (property_id, image_url, alt_text, sort_order) VALUES (?, ?, ?, ?)",
            [
              propertyId,
              key,
              `${properties[0].name} property photo`,
              startOrder + index,
            ],
          );
          if (result.insertId) insertedIds.push(result.insertId);
        }
        await deps.execute(
          "UPDATE properties SET updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?",
          [propertyId],
        );
        res.status(201).json({
          photos: await propertyPhotos(deps, propertyId, deps.backendOrigin),
        });
      } catch (error) {
        await deleteImages(uploadedKeys);
        if (insertedIds.length) {
          await deps.execute(
            `DELETE FROM property_photos WHERE id IN (${insertedIds.map(() => "?").join(",")})`,
            insertedIds,
          );
        }
        throw error;
      }
    },
  );
  router.delete("/properties/:id/photos/:photoId", async (req, res) => {
    const rows = await deps.query<{ id: number; image_url: string }>(
      "SELECT id, image_url FROM property_photos WHERE id = ? AND property_id = ?",
      [req.params.photoId, req.params.id],
    );
    if (!rows[0]) {
      res.status(404).json({ message: "Photo not found." });
      return;
    }
    await deps.execute("DELETE FROM property_photos WHERE id = ?", [
      rows[0].id,
    ]);
    if (rows[0].image_url.startsWith("property-photos/")) {
      await deleteImages([rows[0].image_url]);
    }
    await deps.execute(
      "UPDATE properties SET updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?",
      [req.params.id],
    );
    res.json({ deleted: true });
  });
  router.patch("/properties/:id", async (req, res) => {
    let property;
    let slug: string;
    try {
      slug = validateSlug(req.body?.slug);
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
    let phone: string | null;
    try {
      phone = normalizeUsPhone(req.body.phone);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
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
    const duplicates = await deps.query(
      "SELECT id FROM properties WHERE slug = ? AND id <> ?",
      [slug, req.params.id],
    );
    if (duplicates.length) {
      res.status(409).json({
        message: "This URL slug is already in use. Choose another slug.",
      });
      return;
    }
    let result;
    try {
      result = await deps.execute(
        "UPDATE properties SET slug = ?, name = ?, address_line1 = ?, property_type = ?, website_url = ?, description = ?, agency_id = ?, address_line2 = ?, city = ?, state = ?, postal_code = ?, latitude = ?, longitude = ?, phone = ? WHERE id = ?",
        [
          slug,
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
          phone,
          req.params.id,
        ],
      );
    } catch (error) {
      if ((error as { code?: string }).code === "ER_DUP_ENTRY") {
        res.status(409).json({
          message: "This URL slug is already in use. Choose another slug.",
        });
        return;
      }
      throw error;
    }
    if (!result.affectedRows) {
      res.status(404).json({ message: "Property not found." });
      return;
    }
    res.json({ updated: true });
  });
  return router;
}
