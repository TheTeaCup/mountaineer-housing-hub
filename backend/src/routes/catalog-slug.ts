import type { CatalogDatabase } from "./account.js";

export function catalogSlug(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 140)
      .replace(/^-|-$/g, "") || "listing"
  );
}

export function validateSlug(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length > 140 ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
  ) {
    throw new Error(
      "Use a URL slug of up to 140 lowercase letters, numbers, and single hyphens.",
    );
  }
  return value;
}

export async function availableSlug(
  db: CatalogDatabase,
  table: "properties" | "agencies",
  name: string,
  requested?: unknown,
) {
  const base =
    requested === undefined ? catalogSlug(name) : validateSlug(requested);
  for (let suffix = 1; ; suffix++) {
    const slug = suffix === 1 ? base : `${base.slice(0, 130)}-${suffix}`;
    const rows = await db.query(`SELECT id FROM ${table} WHERE slug = ?`, [
      slug,
    ]);
    if (!rows.length) return slug;
    if (requested !== undefined)
      throw new Error("This URL slug is already in use. Choose another slug.");
  }
}
