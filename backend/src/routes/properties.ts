import { Router } from "express";
import { propertyPhotoUrl } from "./property-photos.js";

export interface PropertyRow {
  id: number;
  name: string;
  slug: string;
  property_type: string;
  description: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  bus_route_ids: string[] | null;
  parking_type: "free" | "monthly" | "yearly" | "semester" | "one_time" | null;
  parking_fee: number | string | null;
  parking_notes: string | null;
  website_url: string | null;
  phone: string | null;
  agency_id: number | null;
  agency_name: string | null;
  agency_slug: string | null;
  agency_website: string | null;
  agency_phone: string | null;
  review_count: number | string;
  average_rating: number | string | null;
}
export interface FloorPlanRow {
  id: number;
  property_id: number;
  name: string;
  bedrooms: number;
  bathrooms: number | string;
  square_feet: number | null;
  rent_min: number | string | null;
  rent_max: number | string | null;
  rent_basis: string;
  description: string | null;
}
interface PhotoRow {
  id: number;
  property_id: number;
  image_url: string;
  alt_text: string | null;
}
const numberOrNull = (value: number | string | null) =>
  value === null ? null : Number(value);

export function publicProperty(
  row: PropertyRow,
  plans: FloorPlanRow[],
  photos: PhotoRow[],
  backendOrigin: string,
) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    property_type: row.property_type,
    description: row.description,
    address: [
      row.address_line1,
      row.address_line2,
      row.city,
      row.state,
      row.postal_code,
    ]
      .filter(Boolean)
      .join(", "),
    latitude: numberOrNull(row.latitude),
    longitude: numberOrNull(row.longitude),
    bus_route_ids: row.bus_route_ids ?? [],
    parking_type: row.parking_type,
    parking_fee: numberOrNull(row.parking_fee),
    parking_notes: row.parking_notes,
    website_url: row.website_url,
    phone: row.phone,
    agency:
      row.agency_id === null
        ? null
        : {
            id: row.agency_id,
            name: row.agency_name,
            slug: row.agency_slug,
            website_url: row.agency_website,
            phone: row.agency_phone,
          },
    review_count: Number(row.review_count),
    average_rating: numberOrNull(row.average_rating),
    floor_plans: plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      bedrooms: plan.bedrooms,
      bathrooms: Number(plan.bathrooms),
      square_feet: plan.square_feet,
      rent_min: numberOrNull(plan.rent_min),
      rent_max: numberOrNull(plan.rent_max),
      rent_basis: plan.rent_basis,
      description: plan.description,
    })),
    photos: photos.map((photo) => ({
      image_url: propertyPhotoUrl(photo, backendOrigin),
      alt_text: photo.alt_text,
    })),
  };
}

export function createPropertiesRouter(
  query: <T>(sql: string, params?: unknown[]) => Promise<T[]>,
  backendOrigin: string,
) {
  const router = Router();
  const select = `SELECT p.id, p.name, p.slug, p.property_type, p.description,
    p.address_line1, p.address_line2, p.city, p.state, p.postal_code,
    p.latitude, p.longitude, p.bus_route_ids, p.parking_type, p.parking_fee, p.parking_notes, p.website_url, p.phone,
    p.agency_id, a.name AS agency_name, a.slug AS agency_slug, a.website_url AS agency_website, a.phone AS agency_phone,
    COALESCE(r.review_count, 0) AS review_count, r.average_rating
    FROM properties p LEFT JOIN agencies a ON a.id = p.agency_id
    LEFT JOIN (SELECT property_id, COUNT(*) AS review_count, AVG(rating) AS average_rating
      FROM reviews WHERE status = 'published' GROUP BY property_id) r ON r.property_id = p.id
    WHERE p.status = 'published'`;
  async function hydrate(rows: PropertyRow[]) {
    if (!rows.length) return [];
    const ids = rows.map((row) => row.id);
    const placeholders = ids.map(() => "?").join(",");
    const [plans, photos] = await Promise.all([
      query<FloorPlanRow>(
        `SELECT id, property_id, name, bedrooms, bathrooms, square_feet, rent_min, rent_max, rent_basis, description FROM floor_plans WHERE property_id IN (${placeholders}) ORDER BY bedrooms, name`,
        ids,
      ),
      query<PhotoRow>(
        `SELECT id, property_id, image_url, alt_text FROM property_photos WHERE property_id IN (${placeholders}) ORDER BY sort_order, id`,
        ids,
      ),
    ]);
    return rows.map((row) =>
      publicProperty(
        row,
        plans.filter((plan) => plan.property_id === row.id),
        photos.filter((photo) => photo.property_id === row.id),
        backendOrigin,
      ),
    );
  }
  router.get("/", async (req, res) => {
    const limit = Math.max(
      1,
      Math.min(500, Math.floor(Number(req.query.limit) || 100)),
    );
    const search =
      typeof req.query.q === "string" ? req.query.q.trim().slice(0, 100) : "";
    // Treat user search terms literally rather than interpreting LIKE wildcards.
    const term = `%${search.replace(/[!%_]/g, "!$&")}%`;
    const filter = search
      ? " AND (p.name LIKE ? ESCAPE '!' OR p.address_line1 LIKE ? ESCAPE '!' OR p.description LIKE ? ESCAPE '!' OR a.name LIKE ? ESCAPE '!')"
      : "";
    const photoFilter =
      req.query.photos === "required"
        ? " AND EXISTS (SELECT 1 FROM property_photos ph WHERE ph.property_id = p.id AND TRIM(ph.image_url) <> '')"
        : "";
    const params: unknown[] = search ? [term, term, term, term] : [];
    let selection = filter + photoFilter;
    let order = "p.updated_at DESC, p.id DESC";
    if (req.query.appalcart === "1") {
      selection += " AND JSON_LENGTH(p.bus_route_ids) > 0";
    }
    const numericFilter = (key: string, max = Number.MAX_SAFE_INTEGER) => {
      const value = req.query[key];
      if (value === undefined || value === "") return undefined;
      if (
        typeof value !== "string" ||
        !Number.isFinite(Number(value)) ||
        Number(value) < 0 ||
        Number(value) > max
      ) {
        throw new Error(`Invalid ${key} filter.`);
      }
      return Number(value);
    };
    try {
      const minRent = numericFilter("minRent");
      const maxRent = numericFilter("maxRent");
      const minReviews = numericFilter("minReviews");
      const minRating = numericFilter("minRating", 5);
      const basis = req.query.rentBasis;
      const parking = req.query.parking;
      if (parking !== undefined) {
        if (
          typeof parking !== "string" ||
          !["free", "monthly", "yearly", "semester", "one_time"].includes(
            parking,
          )
        ) {
          throw new Error("Invalid parking filter.");
        }
        selection += " AND p.parking_type = ?";
        params.push(parking);
      }
      if (
        basis !== undefined &&
        basis !== "per_unit" &&
        basis !== "per_bedroom"
      ) {
        throw new Error("Invalid rent basis filter.");
      }
      if (minRent !== undefined && maxRent !== undefined && minRent > maxRent) {
        throw new Error("Minimum rent must not exceed maximum rent.");
      }
      if (minRent !== undefined || maxRent !== undefined) {
        // One layout must match all rent conditions. Unknown rents do not qualify.
        selection +=
          " AND EXISTS (SELECT 1 FROM floor_plans fp WHERE fp.property_id = p.id AND fp.rent_min IS NOT NULL";
        if (basis) {
          selection += " AND fp.rent_basis = ?";
          params.push(basis);
        }
        if (minRent !== undefined) {
          selection += " AND COALESCE(fp.rent_max, fp.rent_min) >= ?";
          params.push(minRent);
        }
        if (maxRent !== undefined) {
          selection += " AND fp.rent_min <= ?";
          params.push(maxRent);
        }
        selection += ")";
      }
      if (minReviews !== undefined) {
        selection += " AND COALESCE(r.review_count, 0) >= ?";
        params.push(minReviews);
      }
      if (minRating !== undefined) {
        selection += " AND r.average_rating >= ?";
        params.push(minRating);
      }
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
      return;
    }
    if (req.query.sort === "recently-reviewed") {
      const rows = await query<
        PropertyRow & { review_date: Date; review_excerpt: string }
      >(
        `SELECT ranked.*, review.updated_at AS review_date, LEFT(review.body, 180) AS review_excerpt
         FROM (${select}${selection}) ranked
         JOIN reviews review ON review.id = (
           SELECT id FROM reviews WHERE property_id = ranked.id AND status = 'published'
           ORDER BY updated_at DESC, id DESC LIMIT 1
         )
         ORDER BY review.updated_at DESC, review.id DESC LIMIT ?`,
        [...params, limit],
      );
      const properties = await hydrate(rows);
      res.json(
        properties.map((property, index) => ({
          ...property,
          latest_review: {
            date: rows[index].review_date,
            excerpt: rows[index].review_excerpt,
          },
        })),
      );
      return;
    }
    if (req.query.sort === "top-rated") {
      selection += " AND r.review_count >= 3";
      order = "r.average_rating DESC, r.review_count DESC, p.id DESC";
    }
    if (req.query.sort === "sponsored") {
      const slugs = [
        ...new Set(
          (process.env.SPONSORED_PROPERTY_SLUGS ?? "")
            .split(",")
            .map((slug) => slug.trim())
            .filter(Boolean),
        ),
      ];
      if (!slugs.length) {
        res.json([]);
        return;
      }
      const placeholders = slugs.map(() => "?").join(", ");
      selection += ` AND p.slug IN (${placeholders})`;
      order = `FIELD(p.slug, ${placeholders})`;
      params.push(...slugs, ...slugs);
    }
    if (req.query.sort === "random") {
      order = "RAND()";
      res.setHeader("Cache-Control", "no-store");
    }
    const rows = await query<PropertyRow>(
      `${select}${selection} ORDER BY ${order} LIMIT ?`,
      [...params, limit],
    );
    res.json(await hydrate(rows));
  });
  router.get("/:slug", async (req, res) => {
    const rows = await query<PropertyRow>(`${select} AND p.slug = ? LIMIT 1`, [
      req.params.slug,
    ]);
    if (!rows[0]) {
      res.status(404).json({ message: "Property not found." });
      return;
    }
    res.json((await hydrate(rows))[0]);
  });
  return router;
}
