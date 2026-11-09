import { Router } from "express";
import { createHash, randomBytes } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import validator from "validator";
import type { AccountDependencies, CatalogDatabase } from "./account.js";

export const tokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export async function issueSetupLink(
  db: CatalogDatabase,
  userId: string | number,
  frontendOrigin: string,
) {
  const token = randomBytes(32).toString("hex");
  await db.execute(
    "UPDATE external_accounts SET invite_hash = ?, invite_expires_at = DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL 24 HOUR) WHERE user_id = ?",
    [tokenHash(token), userId],
  );
  const url = new URL("/auth/agency-setup", frontendOrigin);
  // A fragment keeps the setup secret out of HTTP access logs and referrers.
  url.hash = token;
  return url.href;
}

export function externalAccountInput(body: Record<string, unknown>) {
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (
    !name ||
    name.length > 255 ||
    !validator.isEmail(email) ||
    email.length > 255 ||
    /@appstate\.edu$/i.test(email)
  )
    throw new Error("Enter a name and a valid non-App State email address.");
  return { email, name };
}

export function createExternalSetupRouter(deps: AccountDependencies) {
  const router = Router();
  router.post("/activate", async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    if (req.headers.origin !== deps.frontendOrigin) {
      res.status(403).json({ message: "Request origin is not allowed." });
      return;
    }
    const { token, password } = req.body ?? {};
    if (
      typeof token !== "string" ||
      !/^[a-f0-9]{64}$/.test(token) ||
      typeof password !== "string" ||
      password.length < 12 ||
      password.length > 128
    ) {
      res
        .status(400)
        .json({
          message:
            "Use a valid setup link and a password between 12 and 128 characters.",
        });
      return;
    }
    const digest = tokenHash(token);
    const candidates = await deps.query<{ user_id: number }>(
      "SELECT ea.user_id FROM external_accounts ea JOIN users u ON u.id = ea.user_id WHERE ea.invite_hash = ? AND ea.invite_expires_at > CURRENT_TIMESTAMP(3) AND u.status = 'active'",
      [digest],
    );
    if (!candidates[0]) {
      res
        .status(400)
        .json({
          message:
            "This setup link has expired or has already been used. Ask staff for a new link.",
        });
      return;
    }
    const hash = await hashPassword(password);
    const activated = await deps.transaction(async (db) => {
      const rows = await db.query<{ user_id: number }>(
        "SELECT ea.user_id FROM external_accounts ea JOIN users u ON u.id = ea.user_id WHERE ea.invite_hash = ? AND ea.invite_expires_at > CURRENT_TIMESTAMP(3) AND u.status = 'active' FOR UPDATE",
        [digest],
      );
      if (!rows[0]) return false;
      const id = rows[0].user_id;
      await db.execute(
        "INSERT INTO auth_accounts (userId, accountId, providerId, password) VALUES (?, ?, 'credential', ?) ON DUPLICATE KEY UPDATE password = VALUES(password), updatedAt = CURRENT_TIMESTAMP(3)",
        [id, String(id), hash],
      );
      await db.execute(
        "UPDATE external_accounts SET activated_at = COALESCE(activated_at, CURRENT_TIMESTAMP(3)), invite_hash = NULL, invite_expires_at = NULL WHERE user_id = ?",
        [id],
      );
      await db.execute("DELETE FROM auth_sessions WHERE userId = ?", [id]);
      return true;
    });
    if (!activated) {
      res
        .status(400)
        .json({
          message: "This setup link has expired or has already been used.",
        });
      return;
    }
    res.json({ activated: true });
  });
  return router;
}
