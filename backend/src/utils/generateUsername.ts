import { generateUsername } from "unique-username-generator";
import { query } from "../db/query.js";

async function generateUniqueUsername(): Promise<string> {
  while (true) {
    const username = generateUsername("-");

    const rows = await query(
      "SELECT 1 FROM user_profiles WHERE username = ? LIMIT 1",
      [username],
    );

    if (rows.length === 0) return username;
  }
}

export { generateUniqueUsername };
