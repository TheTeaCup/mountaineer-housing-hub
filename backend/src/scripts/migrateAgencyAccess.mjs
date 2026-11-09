import "dotenv/config";
import mysql from "mysql2/promise";
import { readFile } from "node:fs/promises";

const db = await mysql.createConnection({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT),
  user: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DBNAME,
  connectTimeout: 10_000,
  multipleStatements: true,
});
try {
  await db.query(
    await readFile(
      new URL("../db/migrations/008_agency_access.sql", import.meta.url),
      "utf8",
    ),
  );
  console.log("External accounts and agency access storage are ready.");
} finally {
  await db.end();
}
