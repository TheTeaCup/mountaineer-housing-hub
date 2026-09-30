import dotenv from "dotenv";

dotenv.config();

const {
  MYSQL_HOST,
  MYSQL_PORT,
  MYSQL_USERNAME,
  MYSQL_PASSWORD,
  MYSQL_DBNAME,
  REDIS_URL,
  PORT,
  JWT_SECRET,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
  CLOUDFLARE_R2_ACCESS_KEY_ID,
  CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  CLOUDFLARE_R2_BUCKET_NAME,
  CLOUDFLARE_R2_CONNECTION_STRING,
  FRONTEND_URL,
  BETTER_AUTH_SECRET,
  BETTER_AUTH_URL,
} = process.env;

const requiredVariables = {
  MYSQL_HOST,
  MYSQL_PORT,
  MYSQL_USERNAME,
  MYSQL_PASSWORD,
  MYSQL_DBNAME,
  REDIS_URL,
  PORT,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  CLOUDFLARE_R2_ACCESS_KEY_ID,
  CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  CLOUDFLARE_R2_BUCKET_NAME,
  CLOUDFLARE_R2_CONNECTION_STRING,
  FRONTEND_URL,
  BETTER_AUTH_SECRET,
  BETTER_AUTH_URL,
};

const missingVariables = Object.entries(requiredVariables)
  .filter(([, value]) => !value)
  .map(([name]) => name);

if (missingVariables.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingVariables.join(", ")}`,
  );
}

const env = requiredVariables as {
  [Key in keyof typeof requiredVariables]: string;
};

const mysqlPort = Number(env.MYSQL_PORT);
const serverPort = Number(env.PORT);

if (!Number.isInteger(mysqlPort) || mysqlPort < 1 || mysqlPort > 65535)
  throw new Error("MYSQL_PORT must be a valid TCP port");
if (!Number.isInteger(serverPort) || serverPort < 1 || serverPort > 65535)
  throw new Error("PORT must be a valid TCP port");

new URL(env.REDIS_URL);
new URL(env.FRONTEND_URL);
new URL(env.CLOUDFLARE_R2_CONNECTION_STRING);

if (env.BETTER_AUTH_SECRET.length < 32)
  throw new Error("BETTER_AUTH_SECRET must contain at least 32 characters");
if (new URL(env.BETTER_AUTH_URL).pathname !== "/")
  throw new Error(
    "BETTER_AUTH_URL must be the public authentication origin without a path",
  );

export const config = {
  MYSQL: {
    HOST: env.MYSQL_HOST,
    PORT: mysqlPort,
    USERNAME: env.MYSQL_USERNAME,
    PASSWORD: env.MYSQL_PASSWORD,
    DBNAME: env.MYSQL_DBNAME,
  },
  REDIS_URL: env.REDIS_URL,
  PORT: serverPort,
  JWT_SECRET: JWT_SECRET ?? "",
  GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI: GOOGLE_REDIRECT_URI ?? "",
  TRUST_PROXY: process.env.TRUST_PROXY ?? "",
  AUTH_PROXY_SECRET: process.env.AUTH_PROXY_SECRET,
  CLOUDFLARE_R2: {
    ACCESS_KEY_ID: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    SECRET_ACCESS_KEY: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    BUCKET_NAME: env.CLOUDFLARE_R2_BUCKET_NAME,
    CONNECTION_STRING: env.CLOUDFLARE_R2_CONNECTION_STRING,
  },
  FRONTEND_URL: env.FRONTEND_URL,
  BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET,
  BETTER_AUTH_URL: env.BETTER_AUTH_URL,
};
