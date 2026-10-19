import { availableSlug } from "./catalog-slug.js";
import type { CatalogDatabase } from "./account.js";
import { validatePublication } from "./publication.js";

export async function publishSuggestion(
  db: CatalogDatabase,
  id: string,
  edits: Record<string, unknown> = {},
) {
  const rows = await db.query<Record<string, unknown>>(
    "SELECT * FROM apartment_submissions WHERE id = ? AND status = 'pending' FOR UPDATE",
    [id],
  );
  if (!rows.length) return null;
  const { submission, details, latitude, longitude } = validatePublication({
    ...rows[0],
    ...edits,
    submission_kind: rows[0].submission_kind,
  });
  let agencyId = submission.agency_id;
  if (
    submission.submission_kind === "agency" ||
    submission.proposed_agency_name
  ) {
    const name = (
      submission.submission_kind === "agency"
        ? submission.name
        : submission.proposed_agency_name
    )!;
    const agency = await db.execute(
      "INSERT INTO agencies (name, slug, website_url, description, phone) VALUES (?, ?, ?, ?, ?)",
      [
        name,
        await availableSlug(db, "agencies", name),
        submission.submission_kind === "agency"
          ? submission.website
          : submission.proposed_agency_website,
        submission.submission_kind === "agency" ? submission.information : null,
        submission.submission_kind === "agency" ? details.phone : null,
      ],
    );
    agencyId = agency.insertId!;
  }
  let propertyId: number | undefined;
  if (submission.submission_kind === "property") {
    const property = await db.execute(
      "INSERT INTO properties (name, slug, property_type, address_line1, website_url, description, agency_id, address_line2, city, state, postal_code, phone, latitude, longitude, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published')",
      [
        submission.name,
        await availableSlug(db, "properties", submission.name!, edits.slug),
        submission.property_type,
        submission.address,
        submission.website,
        submission.information,
        agencyId,
        details.address_line2,
        details.city,
        details.state,
        details.postal_code,
        details.phone,
        latitude,
        longitude,
      ],
    );
    propertyId = property.insertId;
  }
  await db.execute(
    "UPDATE apartment_submissions SET status = 'approved', name = ?, address = ?, property_type = ?, website = ?, information = ?, agency_id = ?, proposed_agency_name = ?, proposed_agency_website = ? WHERE id = ?",
    [
      submission.name,
      submission.address,
      submission.property_type,
      submission.website,
      submission.information,
      submission.agency_id,
      submission.proposed_agency_name,
      submission.proposed_agency_website,
      id,
    ],
  );
  return { updated: true, propertyId, agencyId };
}
