import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";

import indexRouter from "./routes/index.js";
import { auth } from "./auth/index.js";
import { config } from "./config.js";
import redis from "./db/redis.js";
import { createAccountRouter } from "./routes/account.js";
import { createStaffRouter } from "./routes/staff.js";
import { query } from "./db/query.js";
import { execute } from "./db/execute.js";
import { ensureAuthProfile } from "./auth/ensureProfile.js";
import { generateUniqueUsername } from "./utils/generateUsername.js";
import { isVerifiedAppStateUser } from "./auth/policy.js";
import { verifiedProxyClientIp } from "./utils/proxyClientIp.js";
import { db } from "./db/connections.js";

async function startServer() {
  const app = express();

  app.use(
    cors({
      origin: config.FRONTEND_URL,
      credentials: true,
    }),
  );
  app.set("trust proxy", config.TRUST_PROXY);

  app.use((req, res, next) => {
    const start = Date.now();
    // Express strips router mount prefixes while handling a request. Capture
    // the original path now, without logging OAuth codes or other query values.
    const requestPath = req.path;

    const cfIp = req.headers["cf-connecting-ip"];

    const ip =
      verifiedProxyClientIp(req.headers, config.AUTH_PROXY_SECRET) ??
      (typeof cfIp === "string"
        ? cfIp
        : (req.ip ?? req.socket.remoteAddress ?? "unknown"));

    // Overwrite unverified input before Better Auth reads this internal header.
    req.headers["x-mountaineer-client-ip"] = ip;

    const client = req.headers["x-client"] || "unknown";
    const appVersion = req.headers["x-app-version"] || "unknown";
    const platform = req.headers["x-platform"] || "unknown";

    res.on("finish", () => {
      const duration = Date.now() - start;

      console.log(
        `[${new Date().toISOString()}] ${ip} [${client}/${platform}/${appVersion}] ${req.method} ${requestPath} -> ${res.statusCode} (${duration}ms)`,
      );
    });

    next();
  });

  // Better Auth MUST be mounted before body parsing
  app.get("/auth/google/start", async (req, res, next) => {
    try {
      const response = await auth.api.signInSocial({
        headers: fromNodeHeaders(req.headers),
        body: {
          provider: "google",
          callbackURL: new URL("/", config.FRONTEND_URL).href,
          errorCallbackURL: new URL(
            "/auth/login?error=google",
            config.FRONTEND_URL,
          ).href,
          disableRedirect: true,
        },
        asResponse: true,
      });
      if (!response.ok) {
        res.redirect(
          new URL("/auth/login?error=google", config.FRONTEND_URL).href,
        );
        return;
      }
      const result = (await response.json()) as { url?: string };
      const destination = result.url ? new URL(result.url) : undefined;
      if (
        destination?.protocol !== "https:" ||
        destination.hostname !== "accounts.google.com"
      ) {
        throw new Error("Google sign-in returned an invalid redirect.");
      }
      // Preserve every Set-Cookie header on the browser navigation response.
      res.setHeader("Set-Cookie", response.headers.getSetCookie());
      res.setHeader("Cache-Control", "no-store");
      res.redirect(destination.href);
    } catch (error) {
      next(error);
    }
  });
  app.all("/auth/{*splat}", toNodeHandler(auth));

  // Parse JSON for all other routes
  app.use(bodyParser.json());
  const accountDependencies = {
    frontendOrigin: new URL(config.FRONTEND_URL).origin,
    getUser: async (headers: Record<string, unknown>) => {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(
          headers as Parameters<typeof fromNodeHeaders>[0],
        ),
      });
      if (!session || !isVerifiedAppStateUser(session.user)) return undefined;
      const users = await query<{ status: string }>(
        "SELECT status FROM users WHERE id = ?",
        [session.user.id],
      );
      return users[0]?.status === "active" ? session.user.id : undefined;
    },
    query,
    execute,
    ensureProfile: ensureAuthProfile,
    generateUsername: generateUniqueUsername,
  };
  app.use("/account", createAccountRouter(accountDependencies));
  app.use("/staff", createStaffRouter(accountDependencies));

  // REST
  app.use("/", indexRouter);

  app.use((req, res) => {
    return res.status(404).json({
      error: true,
      message: "Route not found",
    });
  });

  app.use(
    (
      err: Error,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      console.error(err);

      return res.status(500).json({
        error: true,
        message: "Internal Server Error",
      });
    },
  );

  const connection = await db.getConnection();
  try {
    await connection.ping();
  } finally {
    connection.release();
  }

  await redis.connect();
  await redis.ping();

  const server = app.listen(config.PORT, () =>
    console.log(`WebServer running on http://localhost:${config.PORT}`),
  );

  const shutdown = (signal: string) => {
    console.log(`${signal} received; shutting down`);

    server.close(async () => {
      await Promise.allSettled([
        db.end(),
        redis.isOpen ? redis.quit() : Promise.resolve(),
      ]);
      process.exit(0);
    });
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

startServer().catch(async (error: unknown) => {
  console.error("Backend failed to start:", error);
  await Promise.allSettled([
    db.end(),
    redis.isOpen ? redis.quit() : Promise.resolve(),
  ]);
  process.exit(1);
});
