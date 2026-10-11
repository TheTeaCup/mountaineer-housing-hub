import "dotenv/config";
import mysql from "mysql2/promise";
const email = process.argv[2];
if (!email || !/^[^@\s]+@appstate\.edu$/i.test(email)) throw new Error("Usage: npm run staff:grant -- student@appstate.edu (must already be signed up)");
const db = await mysql.createConnection({ host: process.env.MYSQL_HOST, port: Number(process.env.MYSQL_PORT), user: process.env.MYSQL_USERNAME, password: process.env.MYSQL_PASSWORD, database: process.env.MYSQL_DBNAME });
try {
  const [result] = await db.execute("UPDATE users SET role = 'staff' WHERE email = ? AND email_verified = 1 AND status = 'active'", [email]);
  if (!result.affectedRows) throw new Error("No active, verified account matched that email.");
  console.log("Staff access granted.");
} finally { await db.end(); }
