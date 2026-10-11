export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
).replace(/\/$/, "");

export interface AuthSession {
  user: { id: string; name: string; email: string; image?: string | null };
  session: { id: string; expiresAt: string };
}

async function authRequest<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_URL}/auth/${path}`, {
    method: body === undefined ? "GET" : "POST",
    credentials: "include",
    cache: "no-store",
    ...(body === undefined
      ? {}
      : {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
  });
  if (!response.ok) {
    throw new Error("Unable to complete sign-in. Please try again.");
  }
  return response.json() as Promise<T>;
}

export const getSession = () => authRequest<AuthSession | null>("get-session");
export const signOut = () => authRequest("sign-out", {});

export function signInWithGoogle(): string {
  // A browser navigation lets the API set its OAuth state cookie first-party.
  return `${API_URL}/auth/google/start`;
}
