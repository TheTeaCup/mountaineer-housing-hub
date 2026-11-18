import "dotenv/config";
import mysql from "mysql2/promise";
const db = await mysql.createConnection({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT),
  user: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DBNAME,
  connectTimeout: 10000,
});
try {
  const [columns] = await db.query("SHOW COLUMNS FROM properties");
  const existing = new Set(columns.map((column) => column.Field));
  const changes = [
    "MODIFY COLUMN parking_type ENUM ('free', 'monthly', 'yearly', 'semester', 'one_time') NULL",
  ];
  if (!existing.has("parking_fee"))
    changes.push("ADD COLUMN parking_fee DECIMAL(8, 2) UNSIGNED NULL");
  if (!existing.has("parking_notes"))
    changes.push("ADD COLUMN parking_notes TEXT NULL");
  await db.query(`ALTER TABLE properties ${changes.join(", ")}`);
  console.log("Parking pricing storage is ready.");
} finally {
  await db.end();
}
