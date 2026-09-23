import { createClient } from "redis";
import { config } from "../config.js";

const redis = createClient({
  url: config.REDIS_URL,
});

redis.on("error", (err) => {
  console.error("Redis error:", err);
});

export default redis;
