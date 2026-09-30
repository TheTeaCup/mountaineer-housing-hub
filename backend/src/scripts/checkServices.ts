import dotenv from "dotenv";
import mysql from "mysql2/promise";
import { createClient } from "redis";

dotenv.config();

const serviceVariables = [
  "MYSQL_HOST",
  "MYSQL_PORT",
  "MYSQL_USERNAME",
  "MYSQL_PASSWORD",
  "MYSQL_DBNAME",
  "REDIS_URL",
] as const;

const missingVariables = serviceVariables.filter(
  (name) => !process.env[name]?.trim(),
);

const placeholderVariables = serviceVariables.filter((name) => {
  const value = process.env[name]?.trim().toLowerCase() ?? "";
  return (
    value === "password" ||
    value.includes("replace-with-") ||
    value.includes("host:port") ||
    value.includes("your-")
  );
});

if (missingVariables.length > 0) {
  console.error(
    `Missing service environment variables: ${missingVariables.join(", ")}`,
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

async function checkMySql() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT),
    user: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    database: databaseName,
    connectTimeout: 5_000,
  });

  try {
    await connection.ping();
    const [versionRows] = await connection.query<mysql.RowDataPacket[]>(
      "SELECT VERSION() AS version",
    );
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      `SELECT COUNT(*) AS table_count
       FROM information_schema.tables
       WHERE table_schema = ?`,
      [databaseName],
    );

    const tableCount = Number(rows[0]?.table_count ?? 0);
    const version = String(versionRows[0]?.version ?? "unknown version");
    console.log(
      `Database: connected (${version}; ${tableCount} tables in ${databaseName})`,
    );

    if (tableCount === 0) {
      console.log(
        "MySQL schema is empty; initialize it with src/db/schemas/init.sql.",
      );
    }
  } finally {
    await connection.end();
  }
}

async function checkRedis() {
  const client = createClient({
    url: process.env.REDIS_URL,
    socket: {
      connectTimeout: 5_000,
      reconnectStrategy: false,
    },
  });

  client.on("error", () => {
    // The summarized failure below is more useful and does not expose the URL.
  });

  try {
    await client.connect();
    const response = await client.ping();

    if (response !== "PONG") throw new Error("Unexpected Redis PING response");
    console.log("Redis: connected");
  } finally {
    if (client.isOpen) await client.quit();
  }
}

const results = await Promise.allSettled([checkMySql(), checkRedis()]);
const labels = ["Database", "Redis"];
let failed = false;

results.forEach((result, index) => {
  if (result.status === "rejected") {
    failed = true;
    const message =
      result.reason instanceof Error ? result.reason.message : "Unknown error";
    console.error(`${labels[index]}: connection failed (${message})`);
  }
});

if (failed) process.exit(1);
console.log("Backend services are reachable.");
