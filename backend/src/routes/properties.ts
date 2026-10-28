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
    p.latitude, p.longitude, p.website_url, p.phone,
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
    const order =
      req.query.sort === "random" ? "RAND()" : "p.updated_at DESC, p.id DESC";
    if (req.query.sort === "random") res.setHeader("Cache-Control", "no-store");
    const rows = await query<PropertyRow>(
      `${select}${filter} ORDER BY ${order} LIMIT ?`,
      [...(search ? [term, term, term, term] : []), limit],
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
