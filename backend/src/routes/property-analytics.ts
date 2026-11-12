import type { CatalogDatabase } from "./account.js";

export async function recordPropertyView(
  db: Pick<CatalogDatabase, "execute">,
  slug: string,
) {
  await db.execute(
    `INSERT INTO property_daily_views (property_id, view_date, views)
     SELECT id, UTC_DATE(), 1 FROM properties WHERE slug = ? AND status = 'published'
     ON DUPLICATE KEY UPDATE views = views + 1`,
    [slug],
  );
}

export async function getPropertyAnalytics(
  db: Pick<CatalogDatabase, "query">,
  userId: string,
  days: number,
) {
  const rows = await db.query<{
    id: number;
    name: string;
    slug: string;
    status: string;
    views: string | number;
  }>(
    `SELECT p.id, p.name, p.slug, p.status, COALESCE(SUM(v.views), 0) AS views
     FROM properties p
     JOIN users u ON u.id = ? AND u.status = 'active'
     LEFT JOIN property_daily_views v ON v.property_id = p.id
       AND v.view_date BETWEEN DATE_SUB(UTC_DATE(), INTERVAL ? DAY) AND UTC_DATE()
     WHERE u.role = 'staff' OR EXISTS (
       SELECT 1 FROM property_editors pe WHERE pe.user_id = u.id AND pe.property_id = p.id
     ) OR EXISTS (
       SELECT 1 FROM agency_editors ae WHERE ae.user_id = u.id AND ae.agency_id = p.agency_id
     )
     GROUP BY p.id, p.name, p.slug, p.status
     ORDER BY views DESC, p.name, p.id`,
    [userId, days - 1],
  );
  return rows.map((row) => ({ ...row, views: Number(row.views) }));
}
