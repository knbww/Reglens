/**
 * Supabase credentials, accepting both key formats.
 *
 * Supabase is migrating from the legacy JWT keys (`anon` / `service_role`) to
 * the newer `sb_publishable_…` / `sb_secret_…` pair. New cloud projects issue
 * the new format; older ones and some tooling still show the legacy names.
 * RegLens accepts either, preferring the newer one when both are present.
 *
 * The `NEXT_PUBLIC_*` reads must stay as literal `process.env.X` expressions —
 * Next.js substitutes them at build time, and a dynamic lookup would not be
 * replaced in the browser bundle.
 */

export function supabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not set. Copy .env.example to .env.local and fill in your Supabase project URL.",
    );
  }
  return url;
}

/** The browser-safe key: publishable (new) or anon (legacy). */
export function supabasePublishableKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error(
      "No Supabase browser key set. Provide NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (new projects) or NEXT_PUBLIC_SUPABASE_ANON_KEY (legacy).",
    );
  }
  return key;
}

/**
 * The server-only key: secret (new) or service_role (legacy). Returns
 * `undefined` rather than throwing — only the seed script needs it, and the
 * app must still run without it.
 */
export function supabaseSecretKey(): string | undefined {
  return process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || undefined;
}
