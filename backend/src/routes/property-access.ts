import type { CatalogDatabase } from "./account.js";

export async function canEditProperty(
  db: Pick<CatalogDatabase, "query">,
  userId: string,
  propertyId: string | number,
) {
  const rows = await db.query<{ id: number }>(
    `SELECT p.id FROM properties p WHERE p.id = ? AND (
      EXISTS (SELECT 1 FROM property_editors pe WHERE pe.user_id = ? AND pe.property_id = p.id)
      OR EXISTS (SELECT 1 FROM agency_editors ae WHERE ae.user_id = ? AND ae.agency_id = p.agency_id)
    )`,
    [propertyId, userId, userId],
  );
  return rows.length > 0;
}
