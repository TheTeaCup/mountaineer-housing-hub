/** Convert environment text into the types Express accepts for trust proxy. */
export function parseTrustProxy(
  value: string | undefined,
): boolean | number | string[] {
  const setting = value?.trim() ?? "";
  if (!setting || setting.toLowerCase() === "false") return false;
  if (setting.toLowerCase() === "true") return true;
  if (/^\d+$/.test(setting)) {
    const hops = Number(setting);
    if (!Number.isSafeInteger(hops))
      throw new Error("TRUST_PROXY hop count is too large");
    return hops;
  }
  return setting
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}
