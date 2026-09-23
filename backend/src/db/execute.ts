import type { ResultSetHeader } from "mysql2/promise";
import { db } from "./connections.js";

export async function execute(
  sql: string,
  params?: any[],
): Promise<ResultSetHeader> {
  const [result] = await db.query(sql, params);
  return result as ResultSetHeader;
}
