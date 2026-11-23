import "dotenv/config";
import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";

const db = await mysql.createConnection({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT),
  user: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DBNAME,
  connectTimeout: 10000,
  multipleStatements: true,
});

try {
  const [tables] = await db.query(
    "SHOW TABLES LIKE 'property_correction_reports'",
  );
  if (tables.length) {
    console.log("Property correction reports table already exists.");
  } else {
    const migration = await readFile(
      new URL(
        "../db/migrations/017_property_correction_reports.sql",
        import.meta.url,
      ),
      "utf8",
    );
    await db.query(migration);
    console.log("Property correction reports table is ready.");
  }
} finally {
  await db.end();
}
