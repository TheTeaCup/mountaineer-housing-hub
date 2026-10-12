import { randomUUID } from "node:crypto";
import type { CatalogDatabase } from "./account.js";
import { validateHousingSubmission } from "./housing-submission.js";

export function catalogSlug(name: string) {
  return `${
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 140) || "listing"
  }-${randomUUID()}`;
}

export async function publishSuggestion(db: CatalogDatabase, id: string) {
  const rows = await db.query<Record<string, unknown>>(
    "SELECT * FROM apartment_submissions WHERE id = ? AND status = 'pending' FOR UPDATE",
    [id],
  );
  if (!rows.length) return null;
  const submission = validateHousingSubmission(rows[0]);
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
      "INSERT INTO agencies (name, slug, website_url, description) VALUES (?, ?, ?, ?)",
      [
        name,
        catalogSlug(name),
        submission.submission_kind === "agency"
          ? submission.website
          : submission.proposed_agency_website,
        submission.submission_kind === "agency" ? submission.information : null,
      ],
    );
    agencyId = agency.insertId!;
  }
  let propertyId: number | undefined;
  if (submission.submission_kind === "property") {
    const property = await db.execute(
      "INSERT INTO properties (name, slug, property_type, address_line1, website_url, description, agency_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'published')",
      [
        submission.name,
        catalogSlug(submission.name!),
        submission.property_type,
        submission.address,
        submission.website,
        submission.information,
        agencyId,
      ],
    );
    propertyId = property.insertId;
  }
  await db.execute(
    "UPDATE apartment_submissions SET status = 'approved' WHERE id = ?",
    [id],
  );
  return { updated: true, propertyId, agencyId };
}
