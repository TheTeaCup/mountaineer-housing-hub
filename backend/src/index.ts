import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

import indexRouter from "./routes/index.js";
import { auth } from "./auth/index.js";
import { config } from "./config.js";
import redis from "./db/redis.js";
import { toNodeHandler } from "better-auth/node";
import { verifiedProxyClientIp } from "./utils/proxyClientIp.js";

async function startServer() {
  const app = express();

  app.use(
    cors({
      origin: config.FRONTEND_URL,
      credentials: true,
    }),
  );
  app.set(
    "trust proxy",
    config.TRUST_PROXY
      ? config.TRUST_PROXY.split(",").map((value) => value.trim())
      : false,
  );

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
  app.all("/auth/{*splat}", toNodeHandler(auth));

  // Parse JSON for all other routes
  app.use(bodyParser.json());

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

  await redis.connect();

  app.listen(config.PORT ?? 3000, () =>
    console.log(`WebServer running on http://localhost:${config.PORT ?? 3000}`),
  );
}

startServer();
