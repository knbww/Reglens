import { existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Loads environment files for scripts run outside the Next.js runtime
 * (Prisma CLI, the seed script, flow tests). Next.js loads these itself,
 * so this is a no-op inside the app.
 *
 * Precedence matches Next.js: .env.local overrides .env.
 */
export function loadEnv(cwd = process.cwd()): void {
  for (const file of [".env", ".env.local"]) {
    const path = resolve(cwd, file);
    if (!existsSync(path)) continue;
    try {
      process.loadEnvFile(path);
    } catch {
      // A malformed or unreadable env file should not stop the CLI; the
      // caller surfaces a clearer error when a required variable is missing.
    }
  }
}
