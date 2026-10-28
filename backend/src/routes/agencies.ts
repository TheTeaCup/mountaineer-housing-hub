import { Router } from "express";

interface AgencyRow {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  website_url: string | null;
  phone: string | null;
  email: string | null;
  property_count: number | string;
  review_count: number | string;
  average_rating: number | string | null;
}

const publicAgency = (agency: AgencyRow) => ({
  ...agency,
  property_count: Number(agency.property_count),
  review_count: Number(agency.review_count),
  average_rating:
    agency.average_rating === null ? null : Number(agency.average_rating),
});

export function createAgenciesRouter(
  query: <T>(sql: string, params?: unknown[]) => Promise<T[]>,
) {
  const router = Router();
  const select = `SELECT a.id, a.name, a.slug, a.description, a.website_url, a.phone, a.email,
    COUNT(DISTINCT p.id) AS property_count, COUNT(r.id) AS review_count, AVG(r.rating) AS average_rating
    FROM agencies a
    LEFT JOIN properties p ON p.agency_id = a.id AND p.status = 'published'
    LEFT JOIN reviews r ON r.property_id = p.id AND r.status = 'published'`;

  router.get("/", async (_req, res) => {
    const agencies = await query<AgencyRow>(
      `${select} GROUP BY a.id, a.name, a.slug, a.description, a.website_url, a.phone, a.email
       ORDER BY property_count DESC, a.name LIMIT 500`,
    );
    res.json(agencies.map(publicAgency));
  });

  router.get("/:slug", async (req, res) => {
    const agencies = await query<AgencyRow>(
      `${select} WHERE a.slug = ?
       GROUP BY a.id, a.name, a.slug, a.description, a.website_url, a.phone, a.email
       LIMIT 1`,
      [req.params.slug],
    );
    if (!agencies[0]) {
      res.status(404).json({ message: "Rental agency not found." });
      return;
    }
    const properties = await query<{
      slug: string;
      name: string;
      property_type: string;
      address: string;
      review_count: number | string;
      average_rating: number | string | null;
    }>(
      `SELECT p.slug, p.name, p.property_type,
       CONCAT_WS(', ', p.address_line1, NULLIF(p.address_line2, ''), p.city, p.state, NULLIF(p.postal_code, '')) AS address,
       COUNT(r.id) AS review_count, AVG(r.rating) AS average_rating
       FROM properties p
       LEFT JOIN reviews r ON r.property_id = p.id AND r.status = 'published'
       WHERE p.agency_id = ? AND p.status = 'published'
       GROUP BY p.id, p.slug, p.name, p.property_type, p.address_line1, p.address_line2, p.city, p.state, p.postal_code
       ORDER BY p.name`,
      [agencies[0].id],
    );
    res.json({
      ...publicAgency(agencies[0]),
      properties: properties.map((property) => ({
        ...property,
        review_count: Number(property.review_count),
        average_rating:
          property.average_rating === null
            ? null
            : Number(property.average_rating),
      })),
    });
  });
  return router;
}
