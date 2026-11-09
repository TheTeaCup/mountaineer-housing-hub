import type { CatalogDatabase } from "./account.js";

export interface AuditProperty {
  id: number;
  name: string;
  status: string;
  description: string | null;
  address_line1: string;
  city: string;
  state: string;
  postal_code: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  website_url: string | null;
  phone: string | null;
  photo_count: number | string;
  plan_count: number | string;
  unpriced_plan_count: number | string;
}

export interface AuditAgency {
  id: number;
  name: string;
  description: string | null;
  website_url: string | null;
  phone: string | null;
  email: string | null;
}

interface AuditIssue {
  label: string;
  href: string;
}
interface AuditItem {
  id: number;
  name: string;
  kind: "property" | "agency";
  status?: string;
  href: string;
  issues: AuditIssue[];
}

const missing = (value: string | null) => !value?.trim();

export function buildSetupAudit(
  properties: AuditProperty[],
  agencies: AuditAgency[],
) {
  const items: AuditItem[] = [];
  for (const property of properties) {
    if (property.status === "archived") continue;
    const href = `/staff/properties/${property.id}`;
    const issues: AuditIssue[] = [];
    const add = (label: string, section = "") =>
      issues.push({ label, href: href + section });
    if (
      [
        property.address_line1,
        property.city,
        property.state,
        property.postal_code,
      ].some(missing)
    )
      add("Complete the street address, city, state, and postal code.");
    if (
      property.latitude === null ||
      property.longitude === null ||
      !Number.isFinite(Number(property.latitude)) ||
      !Number.isFinite(Number(property.longitude)) ||
      Math.abs(Number(property.latitude)) > 90 ||
      Math.abs(Number(property.longitude)) > 180
    )
      add("Add valid map coordinates so the property appears on the map.");
    if (missing(property.description)) add("Add a property description.");
    if (missing(property.website_url) && missing(property.phone))
      add("Add a property website or phone number.");
    if (!Number(property.photo_count))
      add("Add at least one property photo.", "/photos");
    if (!Number(property.plan_count))
      add("Add a floor plan and monthly pricing.", "/floor-plans");
    else if (Number(property.unpriced_plan_count))
      add(
        `Add monthly pricing for ${property.unpriced_plan_count} floor ${Number(property.unpriced_plan_count) === 1 ? "plan" : "plans"}.`,
        "/floor-plans",
      );
    if (issues.length)
      items.push({
        id: property.id,
        name: property.name,
        kind: "property",
        status: property.status,
        href,
        issues,
      });
  }
  for (const agency of agencies) {
    const href = `/staff/agencies/${agency.id}`;
    const issues: AuditIssue[] = [];
    if (missing(agency.description))
      issues.push({ label: "Add an agency description.", href });
    if (missing(agency.website_url))
      issues.push({ label: "Add an agency website.", href });
    if (missing(agency.phone) && missing(agency.email))
      issues.push({
        label: "Add an agency phone number or email address.",
        href,
      });
    if (issues.length)
      items.push({
        id: agency.id,
        name: agency.name,
        kind: "agency",
        href,
        issues,
      });
  }
  items.sort(
    (a, b) =>
      b.issues.length - a.issues.length ||
      a.name.localeCompare(b.name) ||
      a.id - b.id,
  );
  return {
    issue_count: items.reduce((total, item) => total + item.issues.length, 0),
    property_count: items.filter((item) => item.kind === "property").length,
    agency_count: items.filter((item) => item.kind === "agency").length,
    items,
  };
}

export async function loadSetupAudit(db: CatalogDatabase) {
  const [properties, agencies] = await Promise.all([
    db.query<AuditProperty>(`SELECT p.id, p.name, p.status, p.description,
      p.address_line1, p.city, p.state, p.postal_code, p.latitude, p.longitude, p.website_url, p.phone,
      (SELECT COUNT(*) FROM property_photos ph WHERE ph.property_id = p.id) AS photo_count,
      (SELECT COUNT(*) FROM floor_plans fp WHERE fp.property_id = p.id) AS plan_count,
      (SELECT COUNT(*) FROM floor_plans fp WHERE fp.property_id = p.id AND fp.rent_min IS NULL) AS unpriced_plan_count
      FROM properties p WHERE p.status <> 'archived' ORDER BY p.name, p.id`),
    db.query<AuditAgency>(
      "SELECT id, name, description, website_url, phone, email FROM agencies ORDER BY name, id",
    ),
  ]);
  return buildSetupAudit(properties, agencies);
}
