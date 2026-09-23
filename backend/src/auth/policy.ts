import type { BetterAuthOptions } from "better-auth";
import {
  APIError,
  createAuthMiddleware,
  getSessionFromCtx,
} from "better-auth/api";

export function isVerifiedAppStateUser(
  user: { email?: unknown; emailVerified?: unknown } | null | undefined,
): boolean {
  return (
    user?.emailVerified === true &&
    typeof user.email === "string" &&
    /^[^@\s]+@appstate\.edu$/i.test(user.email)
  );
}

// Shared by production and the isolated authentication tests.
export const authPolicy = {
  emailAndPassword: {
    enabled: false,
  },
  user: {
    modelName: "users",
    // Runs for new users, account linking, and returning OAuth sign-ins.
    validateUserInfo: ({ user, source }) => {
      if (
        source.method !== "oauth" ||
        source.oauth?.providerId !== "google" ||
        !isVerifiedAppStateUser(user)
      ) {
        return {
          error: "appstate_google_required",
          errorDescription: "Sign in with your verified @appstate.edu Google account.",
        };
      }
    },
    additionalFields: {
      status: {
        type: "string",
        defaultValue: "active",
        input: false,
        returned: false,
      },
    },
    fields: {
      name: "auth_name",
      image: "auth_image",
      emailVerified: "email_verified",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },

  account: {
    modelName: "auth_accounts",
    accountLinking: {
      enabled: true,
      disableImplicitLinking: true,
      allowDifferentEmails: true,
    },
  },

  session: {
    modelName: "auth_sessions",
    expiresIn: 60 * 60 * 24 * 7,
    cookieCache: {
      enabled: false,
    },
  },

  rateLimit: {
    enabled: true,
    storage: "database",
    modelName: "auth_rate_limits",
  },

  advanced: {
    database: {
      generateId: "serial",
    },
    ipAddress: {
      ipAddressHeaders: ["x-mountaineer-client-ip"],
    },
  },

  databaseHooks: {
    session: {
      create: {
        before: async (session, context) => {
          // Read through Better Auth's current transaction:
          // a new user may not yet be committed.
          const user = await context?.context.internalAdapter.findUserById(
            session.userId,
          );

          if (
            (user as { status?: string } | null)?.status !== "active" ||
            !isVerifiedAppStateUser(user)
          ) {
            throw new APIError("FORBIDDEN", {
              message: "This account is unavailable.",
            });
          }

          return {
            data: session,
          };
        },
      },
    },
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-out") {
        const session = await getSessionFromCtx(ctx);

        if (session) {
          const user = await ctx.context.internalAdapter.findUserById(
            session.user.id,
          );

          if (
            (user as { status?: string } | null)?.status !== "active" ||
            !isVerifiedAppStateUser(user)
          ) {
            throw new APIError("FORBIDDEN", {
              message: "This account is unavailable.",
            });
          }
        }
      }
    }),
  },
} satisfies BetterAuthOptions;
