import type { CatalogDatabase } from "./account.js";

export async function canEditProperty(
  db: Pick<CatalogDatabase, "query">,
  userId: string,
  propertyId: string | number,
) {
  const rows = await db.query<{ id: number }>(
    `SELECT p.id FROM properties p JOIN users u ON u.id = ?
    WHERE p.id = ? AND u.status = 'active' AND u.role = 'property_manager' AND (
      EXISTS (SELECT 1 FROM property_editors pe WHERE pe.user_id = ? AND pe.property_id = p.id)
      OR EXISTS (SELECT 1 FROM agency_editors ae WHERE ae.user_id = ? AND ae.agency_id = p.agency_id)
    )`,
    [userId, propertyId, userId, userId],
  );
  return rows.length > 0;
}

export async function canEditAgency(
  db: Pick<CatalogDatabase, "query">,
  userId: string,
  agencyId: string | number,
) {
  const rows = await db.query<{ id: number }>(
    `SELECT a.id FROM agencies a JOIN users u ON u.id = ?
    WHERE a.id = ? AND u.status = 'active' AND u.role = 'property_manager' AND
      EXISTS (SELECT 1 FROM agency_editors ae WHERE ae.user_id = ? AND ae.agency_id = a.id)`,
    [userId, agencyId, userId],
  );
  return rows.length > 0;
}
