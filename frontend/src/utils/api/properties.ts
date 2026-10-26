import type { FloorPlan, Property } from "@/types/properties";
import { API_URL } from "./auth";

export function mapLocations(properties: Property[]) {
  return properties.filter(
    (property) =>
      property.latitude !== null &&
      property.longitude !== null &&
      Number.isFinite(property.latitude) &&
      Number.isFinite(property.longitude) &&
      Math.abs(property.latitude) <= 90 &&
      Math.abs(property.longitude) <= 180,
  );
}

export async function fetchProperties(
  query = "",
  limit = 100,
  signal?: AbortSignal,
  shuffle = false,
): Promise<Property[]> {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  if (shuffle) params.set("sort", "random");
  const response = await fetch(`${API_URL}/properties?${params}`, {
    signal,
    cache: "no-store",
  });
  if (!response.ok)
    throw new Error(
      "Properties are temporarily unavailable. Please try again.",
    );
  return response.json();
}
export class PropertyRequestError extends Error {
  constructor(public readonly status: number) {
    super(
      status === 404
        ? "Property not found."
        : "Property details are temporarily unavailable. Please try again.",
    );
    this.name = "PropertyRequestError";
  }
}

export async function fetchProperty(
  slug: string,
  signal?: AbortSignal,
): Promise<Property> {
  const response = await fetch(
    `${API_URL}/properties/${encodeURIComponent(slug)}`,
    { signal, cache: "no-store" },
  );
  if (!response.ok) throw new PropertyRequestError(response.status);
  return response.json();
}
export function safeUrl(
  value: string | null | undefined,
  image = false,
): string | undefined {
  if (!value) return undefined;
  if (image && value.startsWith("/") && !value.startsWith("//")) return value;
  try {
    const url = new URL(value);
    if (["http:", "https:"].includes(url.protocol)) return url.href;
  } catch {}
  return undefined;
}
const dollars = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
export function rentSummary(plans: FloorPlan[]): string[] {
  return (["per_unit", "per_bedroom"] as const).flatMap((basis) => {
    const rents = plans
      .filter((plan) => plan.rent_basis === basis && plan.rent_min !== null)
      .map((plan) => plan.rent_min as number);
    return rents.length
      ? [
          `From ${dollars(Math.min(...rents))} / ${basis === "per_unit" ? "unit" : "bedroom"} / month`,
        ]
      : [];
  });
}
export function planRent(plan: FloorPlan): string {
  if (plan.rent_min === null) return "Contact property for pricing";
  const amount =
    plan.rent_max !== null && plan.rent_max !== plan.rent_min
      ? `${dollars(plan.rent_min)}–${dollars(plan.rent_max)}`
      : dollars(plan.rent_min);
  return `${amount} / ${plan.rent_basis === "per_unit" ? "unit" : "bedroom"} / month`;
}
export const propertyTypeLabel = (type: string) =>
  type === "apartment_complex"
    ? "Apartment community"
    : type.replace(/_/g, " ");
