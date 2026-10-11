import { API_URL } from "./auth";

export async function accountRequest<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    credentials: "include",
    cache: "no-store",
    ...(body === undefined
      ? {}
      : {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.message || "The request could not be completed.");
  return data as T;
}

export interface Favorite {
  slug: string;
  name: string;
  status: string;
}
export interface AccountProfile {
  username: string;
  role: string;
  avatar_variant: "beam" | "marble" | "bauhaus" | "ring";
  avatar_palette: "gold" | "forest" | "ocean";
  avatar_seed: string | null;
}
export interface MyReview {
  id: number;
  name: string;
  slug: string;
  rating: number;
  body: string;
  status: string;
}
