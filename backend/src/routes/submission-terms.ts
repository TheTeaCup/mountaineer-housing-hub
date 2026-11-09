import type { CatalogDatabase } from "./account.js";

// Bump these versions whenever the corresponding published policy changes.
export const TERMS_VERSION = "2026-11-09";
export const PRIVACY_VERSION = "2026-11-09";

export function validateSubmissionTerms(body: Record<string, unknown>) {
  if (
    (body.terms_accepted !== true && body.terms_accepted !== "true") ||
    body.terms_version !== TERMS_VERSION ||
    body.privacy_version !== PRIVACY_VERSION
  ) {
    throw new Error(
      "Please agree to the current Terms of Use and acknowledge the Privacy Policy before submitting. Reload the page if the policies have changed.",
    );
  }
}

export async function recordSubmissionTerms(
  db: CatalogDatabase,
  userId: string,
) {
  await db.execute(
    "INSERT INTO user_legal_acceptances (user_id, terms_version, privacy_version) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)",
    [userId, TERMS_VERSION, PRIVACY_VERSION],
  );
}
