import "dotenv/config";
import mysql from "mysql2/promise";
import { readFile } from "node:fs/promises";

const db = await mysql.createConnection({ host: process.env.MYSQL_HOST, port: Number(process.env.MYSQL_PORT), user: process.env.MYSQL_USERNAME, password: process.env.MYSQL_PASSWORD, database: process.env.MYSQL_DBNAME });
try {
  const [columns] = await db.execute("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role'");
  if (!columns.length) await db.query("ALTER TABLE users ADD COLUMN role ENUM ('user','staff') NOT NULL DEFAULT 'user'");
  for (const table of ["favorites", "apartment_submissions"]) {
    const [tables] = await db.execute("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?", [table]);
    if (!tables.length) {
      const file = table === "favorites" ? "favorites.sql" : "submissions.sql";
      await db.query(await readFile(new URL(`../db/schemas/${file}`, import.meta.url), "utf8"));
    }
  }
  const [submissionColumns] = await db.execute("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'apartment_submissions' AND COLUMN_NAME = 'submission_kind'");
  if (!submissionColumns.length) await db.query(await readFile(new URL("../db/migrations/002_property_and_agency_submissions.sql", import.meta.url), "utf8"));
  const [profileColumns] = await db.execute("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_profiles' AND COLUMN_NAME = 'avatar_variant'");
  if (!profileColumns.length) await db.query(await readFile(new URL("../db/migrations/003_generated_profiles.sql", import.meta.url), "utf8"));
  await db.query(await readFile(new URL("../db/migrations/004_clear_google_profile_photos.sql", import.meta.url), "utf8"));
  if (process.argv.includes("--seed-demo")) {
    // Demo catalog seeding is opt-in and unrelated to user-supplied examples.
    const { properties } = await import("../../../frontend/src/data/properties.ts");
    for (const property of properties) {
      const [rows] = await db.execute("SELECT id FROM properties WHERE slug = ?", [property.slug]);
      if (!rows.length) await db.execute("INSERT INTO properties (name, slug, property_type, address_line1, description, status) VALUES (?, ?, 'apartment_complex', ?, ?, 'published')", [property.name, property.slug, property.address, property.description]);
    }
    console.log("Added missing demo apartments from the frontend catalog; existing properties were preserved.");
  }
  console.log("Account and staff database setup complete.");
} finally { await db.end(); }
