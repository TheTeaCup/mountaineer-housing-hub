import { API_URL } from "./auth";

export interface AgencySummary {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  website_url: string | null;
  phone: string | null;
  email: string | null;
  property_count: number;
  review_count: number;
  average_rating: number | null;
}

export interface AgencyProperty {
  slug: string;
  name: string;
  property_type: string;
  address: string;
  review_count: number;
  average_rating: number | null;
}

export interface AgencyDetail extends AgencySummary {
  properties: AgencyProperty[];
}

async function agencyRequest<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    signal,
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(
      response.status === 404
        ? "Rental agency not found."
        : "Rental agencies are temporarily unavailable.",
    );
  }
  return response.json();
}

export const fetchAgencies = (signal?: AbortSignal) =>
  agencyRequest<AgencySummary[]>("/agencies", signal);

export const fetchAgency = (slug: string, signal?: AbortSignal) =>
  agencyRequest<AgencyDetail>(`/agencies/${encodeURIComponent(slug)}`, signal);

export function agencyRatingSummary(agency: {
  average_rating: number | null;
  review_count: number;
}) {
  if (agency.average_rating === null || !agency.review_count)
    return "No published reviews yet";
  return `${agency.average_rating.toFixed(1)}/5 across ${agency.review_count} ${agency.review_count === 1 ? "review" : "reviews"}`;
}
