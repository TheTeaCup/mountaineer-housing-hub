export interface ParsedAddress {
  address: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string | null;
}

const postalCodePattern = /^\d{5}(?:-\d{4})?$/;

export function parseSubmittedAddress(value: string): ParsedAddress | null {
  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (/^(?:US|USA|United States)$/i.test(parts.at(-1) ?? "")) parts.pop();

  let postalCode: string | null = null;
  if (postalCodePattern.test(parts.at(-1) ?? "")) {
    postalCode = parts.pop() ?? null;
  }

  const statePart = parts.pop() ?? "";
  const stateMatch = statePart.match(
    /^([A-Za-z]{2})(?:\s+(\d{5}(?:-\d{4})?))?$/,
  );
  if (!stateMatch || parts.length < 2) return null;

  const city = parts.pop() ?? "";
  const address = parts.shift() ?? "";
  const addressLine2 = parts.join(", ") || null;

  if (!address || !city) return null;
  return {
    address,
    addressLine2,
    city,
    state: stateMatch[1].toUpperCase(),
    postalCode: postalCode ?? stateMatch[2] ?? null,
  };
}
