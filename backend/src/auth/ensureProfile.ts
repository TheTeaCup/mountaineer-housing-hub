import { execute } from "../db/execute.js";
import { query } from "../db/query.js";
import { generateUniqueUsername } from "../utils/generateUsername.js";

// Retry a rare username collision, and repair profiles after interrupted onboarding.
export async function ensureAuthProfile(userId: string): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const rows = await query<{ username: string }>(
      "SELECT username FROM user_profiles WHERE user_id = ?",
      [userId],
    );
    if (rows[0]?.username) return rows[0].username;
    const username = await generateUniqueUsername();
    try {
      if (rows.length) {
        const updated = await execute(
          "UPDATE user_profiles SET username = ? WHERE user_id = ? AND (username IS NULL OR username = '')",
          [username, userId],
        );
        if (updated.affectedRows) return username;
      } else {
        await query(
          "INSERT INTO user_profiles (user_id, username) VALUES (?, ?)",
          [userId, username],
        );
        return username;
      }
    } catch (error) {
      if ((error as { code?: string }).code !== "ER_DUP_ENTRY") throw error;
    }
  }
  throw new Error("Unable to provision user profile");
}
