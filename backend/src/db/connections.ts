import mysql from "mysql2/promise";
import { config } from "../config.js";

export const db = mysql.createPool({
  host: config.MYSQL.HOST || "localhost",
  user: config.MYSQL.USERNAME || "user",
  password: config.MYSQL.PASSWORD || "password",
  database: config.MYSQL.DBNAME || "mountaineer_housing_hub",
  port: Number(config.MYSQL.PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
