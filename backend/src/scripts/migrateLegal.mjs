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
});
try {
  await db.query(await readFile(new URL("../db/migrations/007_user_legal_acceptances.sql", import.meta.url), "utf8"));
  console.log("Submission agreement storage is ready.");
} finally {
  await db.end();
}
