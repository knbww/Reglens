import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { supabasePublishableKey, supabaseUrl } from "./env";

/**
 * Supabase client bound to the request cookie jar.
 *
 * Server Components cannot write cookies, so the `setAll` call is allowed to
 * fail there — the middleware refreshes the session instead.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl(), supabasePublishableKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component — refresh happens in middleware.
        }
      },
    },
  });
}
