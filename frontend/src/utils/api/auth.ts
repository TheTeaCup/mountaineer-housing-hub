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

export async function signInWithGoogle(origin: string): Promise<string> {
  const result = await authRequest<{ url?: string }>("sign-in/social", {
    provider: "google",
    callbackURL: `${origin}/`,
    errorCallbackURL: `${origin}/auth/login?error=google`,
    disableRedirect: true,
  });
  if (!result.url)
    throw new Error("Google sign-in is unavailable. Please try again.");
  const url = new URL(result.url);
  if (url.protocol !== "https:" || url.hostname !== "accounts.google.com") {
    throw new Error("Google sign-in returned an invalid redirect.");
  }
  return url.href;
}
