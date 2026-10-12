import type { ResultSetHeader } from "mysql2/promise";
import type { CatalogDatabase } from "../routes/account.js";
import { db } from "./connections.js";

export async function transaction<T>(
  work: (database: CatalogDatabase) => Promise<T>,
): Promise<T> {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work({
      query: async <R>(sql: string, params?: unknown[]) => {
        const [rows] = await connection.query(sql, params);
        return rows as R[];
      },
      execute: async (sql, params) => {
        const [result] = await connection.query(sql, params);
        return result as ResultSetHeader;
      },
    });
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
