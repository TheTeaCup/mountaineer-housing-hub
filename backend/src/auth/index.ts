import { betterAuth } from "better-auth";
import { getOAuthState } from "better-auth/api";
import { bearer } from "better-auth/plugins";
import { oneTimeToken } from "better-auth/plugins/one-time-token";
import { db } from "../db/connections.js";
import { authPolicy } from "./policy.js";
import { config } from "../config.js";
import { query } from "../db/query.js";
import { ensureAuthProfile } from "./ensureProfile.js";
import { handleNewUserTasks } from "../utils/newUserTasks.js";

export const auth = betterAuth({
  appName: "Mountaineer Housing Hub",

  ...authPolicy,

  database: db,

  secret: config.BETTER_AUTH_SECRET,

  baseURL: config.BETTER_AUTH_URL,

  basePath: "/better",

  plugins: [
    bearer(),

    oneTimeToken({
      expiresIn: 3,
      storeToken: "hashed",
      //disableClientRequest: true,
    }),
  ],

  trustedOrigins: [config.FRONTEND_URL],

  socialProviders: {
    google: {
      hd: "appstate.edu",
      clientId: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
      redirectURI: new URL("/auth/callback/google", config.FRONTEND_URL).href,
    },
  },

  databaseHooks: {
    user: {
      create: {
        after: async (user, context): Promise<void> => {
          const username = await ensureAuthProfile(user.id);

          const oauthState = await getOAuthState();

          const ref = context?.body?.ref ?? oauthState?.ref;

          await handleNewUserTasks({
            userId: Number(user.id),
            username,
            email: user.email,
            provider: context?.params?.id === "google" ? "google" : "local",
          });
        },
      },
    },

    session: {
      create: {
        ...authPolicy.databaseHooks.session.create,

        after: async (session) => {
          await ensureAuthProfile(session.userId);

          await query("UPDATE users SET last_login = NOW() WHERE id = ?", [
            session.userId,
          ]);
        },
      },
    },
  },
});
