import { createHmac, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";
import type { IncomingHttpHeaders } from "node:http";

// Only trust visitor IPs authenticated by our frontend, with a short replay window.
export function verifiedProxyClientIp(
  headers: IncomingHttpHeaders,
  secret: string | undefined,
  now = Date.now(),
): string | undefined {
  if (!secret || secret.length < 32) return undefined;
  const ip = headers["x-mountaineer-client-ip"];
  const timestamp = headers["x-mountaineer-client-ip-time"];
  const signature = headers["x-mountaineer-client-ip-signature"];
  if (
    typeof ip !== "string" ||
    !isIP(ip) ||
    typeof timestamp !== "string" ||
    !/^\d{13}$/.test(timestamp) ||
    Math.abs(now - Number(timestamp)) > 60_000 ||
    typeof signature !== "string" ||
    !/^[a-f0-9]{64}$/.test(signature)
  )
    return undefined;
  const expected = createHmac("sha256", secret)
    .update(`${timestamp}\n${ip}`)
    .digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"))
    ? ip
    : undefined;
}
