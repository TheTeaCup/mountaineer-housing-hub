import { validateHousingSubmission } from "./housing-submission.js";
import { normalizeUsPhone } from "../utils/phone.js";

export function validatePublication(input: Record<string, unknown>) {
  const submission = validateHousingSubmission(input);
  const latitude =
    input.latitude === "" || input.latitude == null
      ? null
      : Number(input.latitude);
  const longitude =
    input.longitude === "" || input.longitude == null
      ? null
      : Number(input.longitude);
  if (
    (latitude === null) !== (longitude === null) ||
    (latitude !== null &&
      (!Number.isFinite(latitude) || Math.abs(latitude) > 90)) ||
    (longitude !== null &&
      (!Number.isFinite(longitude) || Math.abs(longitude) > 180))
  )
    throw new Error("Enter both valid coordinates, or leave both blank.");
  const details: Record<string, string | null> = {};
  for (const [key, max, fallback] of [
    ["city", 100, "Boone"],
    ["state", 2, "NC"],
    ["address_line2", 255, ""],
    ["postal_code", 10, ""],
    ["phone", 32, ""],
  ] as const) {
    const value = input[key] ?? fallback;
    if (
      typeof value !== "string" ||
      value.length > max ||
      (["city", "state"].includes(key) && !value.trim())
    )
      throw new Error("Check the address and phone fields.");
    details[key] = value.trim() || null;
  }
  if (!/^[A-Za-z]{2}$/.test(details.state!))
    throw new Error("Use a two-letter state code.");
  details.state = details.state!.toUpperCase();
  details.phone = normalizeUsPhone(details.phone);
  return { submission, details, latitude, longitude };
}
