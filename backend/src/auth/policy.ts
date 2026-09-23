import type { BetterAuthOptions } from "better-auth";
import {
  APIError,
  createAuthMiddleware,
  getSessionFromCtx,
} from "better-auth/api";

// Shared by production and the isolated authentication integration tests.
export const authPolicy = {
  user: {
    modelName: "users",
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

          if ((user as { status?: string } | null)?.status !== "active") {
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

          if ((user as { status?: string } | null)?.status !== "active") {
            throw new APIError("FORBIDDEN", {
              message: "This account is unavailable.",
            });
          }
        }
      }
    }),
  },
} satisfies BetterAuthOptions;
