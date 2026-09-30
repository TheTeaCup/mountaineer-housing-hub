import dotenv from "dotenv";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

dotenv.config();

const requiredVariables = [
  "MYSQL_HOST",
  "MYSQL_PORT",
  "MYSQL_USERNAME",
  "MYSQL_PASSWORD",
  "MYSQL_DBNAME",
] as const;

const missingVariables = requiredVariables.filter(
  (name) => !process.env[name]?.trim(),
);

const placeholderVariables = requiredVariables.filter((name) => {
  const value = process.env[name]?.trim().toLowerCase() ?? "";
  return (
    value === "password" ||
    value.includes("replace-with-") ||
    value.includes("your-")
  );
});

if (missingVariables.length > 0) {
  console.error(
    `Missing database environment variables: ${missingVariables.join(", ")}`,
  );
  process.exit(1);
}

if (placeholderVariables.length > 0) {
  console.error(
    `Replace placeholder values in .env: ${placeholderVariables.join(", ")}`,
  );
  process.exit(1);
}

const databaseName = process.env.MYSQL_DBNAME!;
const databasePort = Number(process.env.MYSQL_PORT);

if (!/^[A-Za-z0-9_]+$/.test(databaseName)) {
  console.error(
    "MYSQL_DBNAME may contain only letters, numbers, and underscores.",
  );
  process.exit(1);
}

if (
  !Number.isInteger(databasePort) ||
  databasePort < 1 ||
  databasePort > 65535
) {
  console.error("MYSQL_PORT must be a valid TCP port.");
  process.exit(1);
}

const setupUsername =
  process.env.DB_SETUP_USERNAME?.trim() || process.env.MYSQL_USERNAME!;
const setupPassword =
  process.env.DB_SETUP_PASSWORD ?? process.env.MYSQL_PASSWORD!;

const backendDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const schemaFiles = [
  "users.sql",
  "auth.sql",
  "agencies.sql",
  "properties.sql",
  "floor_plans.sql",
  "reviews.sql",
];

function parseVersion(version: string) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;

  const [, major, minor, patch] = match.map(Number);
  return { major, minor, patch };
}

function isAtLeast(
  version: { major: number; minor: number; patch: number },
  minimum: { major: number; minor: number; patch: number },
) {
  return (
    version.major > minimum.major ||
    (version.major === minimum.major && version.minor > minimum.minor) ||
    (version.major === minimum.major &&
      version.minor === minimum.minor &&
      version.patch >= minimum.patch)
  );
}

function supportsSchema(version: string) {
  const parsedVersion = parseVersion(version);
  if (!parsedVersion) return false;

  if (/mariadb/i.test(version)) {
    return isAtLeast(parsedVersion, { major: 10, minor: 6, patch: 0 });
  }

  return isAtLeast(parsedVersion, { major: 8, minor: 0, patch: 16 });
}

async function setupDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: databasePort,
    user: setupUsername,
    password: setupPassword,
    connectTimeout: 10_000,
    multipleStatements: true,
  });

  try {
    const [versionRows] = await connection.query<mysql.RowDataPacket[]>(
      "SELECT VERSION() AS version",
    );
    const version = String(versionRows[0]?.version ?? "unknown");

    console.log(`Connected to database server ${version}.`);

    if (!supportsSchema(version)) {
      throw new Error(
        "This schema requires MySQL 8.0.16+ or MariaDB 10.6+.",
      );
    }

    const [schemaRows] = await connection.query<mysql.RowDataPacket[]>(
      `SELECT SCHEMA_NAME
       FROM information_schema.schemata
       WHERE SCHEMA_NAME = ?`,
      [databaseName],
    );

    if (schemaRows.length === 0) {
      await connection.query(
        `CREATE DATABASE \`${databaseName}\`
         CHARACTER SET utf8mb4
         COLLATE utf8mb4_unicode_ci`,
      );
      console.log(`Created database ${databaseName}.`);
    } else {
      console.log(`Database ${databaseName} already exists.`);
    }

    const [tableRows] = await connection.query<mysql.RowDataPacket[]>(
      `SELECT COUNT(*) AS table_count
       FROM information_schema.tables
       WHERE table_schema = ?`,
      [databaseName],
    );
    const tableCount = Number(tableRows[0]?.table_count ?? 0);

    if (tableCount > 0) {
      throw new Error(
        `Refusing to initialize ${databaseName} because it already contains ${tableCount} table(s).`,
      );
    }

    await connection.query(`USE \`${databaseName}\``);

    for (const filename of schemaFiles) {
      const schemaPath = path.join(
        backendDirectory,
        "src",
        "db",
        "schemas",
        filename,
      );
      const sql = await readFile(schemaPath, "utf8");
      await connection.query(sql);
      console.log(`Applied ${filename}.`);
    }

    const [finalTableRows] = await connection.query<mysql.RowDataPacket[]>(
      `SELECT COUNT(*) AS table_count
       FROM information_schema.tables
       WHERE table_schema = ?`,
      [databaseName],
    );
    const finalTableCount = Number(finalTableRows[0]?.table_count ?? 0);

    console.log(
      `Database setup complete: ${finalTableCount} tables in ${databaseName}.`,
    );
  } finally {
    await connection.end();
  }
}

setupDatabase().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`Database setup failed: ${message}`);
  console.error(
    "No cleanup was attempted. If files had already been applied, inspect the database before running setup again.",
  );
  process.exit(1);
});
