import { defineConfig } from "prisma/config";
import { loadEnv } from "./src/lib/load-env";

loadEnv();

/**
 * Prisma 7 configuration.
 *
 * Migration and introspection commands read the connection URL from here.
 * The application runtime connects through the pg driver adapter in
 * `src/lib/prisma.ts` instead.
 *
 * On hosted Supabase, DATABASE_URL points at the pooled connection (port 6543)
 * and DIRECT_URL at the direct one (port 5432). Prisma Migrate needs the
 * direct connection, so it is preferred here when present.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
});
