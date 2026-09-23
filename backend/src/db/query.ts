import type { RowDataPacket } from "mysql2/promise";
import { db } from "./connections.js";

export async function query<T = RowDataPacket>(
  sql: string,
  params?: any[],
): Promise<T[]> {
  const [rows] = await db.query(sql, params);
  return rows as T[];
}
