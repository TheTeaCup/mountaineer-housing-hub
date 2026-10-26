import type { Property } from "@/types/properties";
import { rentSummary } from "@/utils/api/properties";

export function propertyDescription(property: Property): string {
  const description = [
    `${property.name} at ${property.address}.`,
    ...rentSummary(property.floor_plans),
    property.description || "Explore floor plans, photos, and student reviews.",
  ]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  if (description.length <= 160) return description;
  const excerpt = description.slice(0, 157);
  const lastSpace = excerpt.lastIndexOf(" ");
  return `${lastSpace > 120 ? excerpt.slice(0, lastSpace) : excerpt}…`;
}
