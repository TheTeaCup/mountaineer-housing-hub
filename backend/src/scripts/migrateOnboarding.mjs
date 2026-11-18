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
  const [columns] = await db.query(
    "SHOW COLUMNS FROM user_profiles LIKE 'onboarding_completed_at'",
  );
  if (!columns.length) {
    await db.query(await readFile(
      new URL("../db/migrations/014_account_onboarding.sql", import.meta.url),
      "utf8",
    ));
    console.log("Migration 014 applied; existing profiles marked complete.");
  } else {
    console.log("Migration 014 column already exists; completion records preserved.");
  }
  const [verified] = await db.query(
    "SHOW COLUMNS FROM user_profiles LIKE 'onboarding_completed_at'",
  );
  if (verified.length !== 1 || verified[0].Null !== "YES") {
    throw new Error("The onboarding completion column could not be verified.");
  }
  console.log("Verified nullable onboarding completion timestamp. New profiles default to incomplete.");
} finally {
  await db.end();
}
