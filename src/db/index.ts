import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;
/** Allows framework builds to complete before deployment secrets are attached. */
export const databaseConfigured = Boolean(databaseUrl);

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    // A closed local port fails fast if an operator starts the app without a DB.
    // Request handlers then return their existing safe error responses.
    connectionString: databaseUrl || "postgresql://postgres@127.0.0.1:1/database_not_configured",
    connectionTimeoutMillis: 750,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
