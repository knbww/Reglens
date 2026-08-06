import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Where the confirmation link lands.
 *
 * Without this route the link in the email had nowhere to go: Supabase issues
 * a one-time code, and something has to trade it for a session cookie. Both
 * shapes are accepted — the PKCE `code` that current projects send, and the
 * older `token_hash` + `type` pair — because which one arrives depends on a
 * dashboard setting rather than on anything in this repository.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  // Only ever an in-app path, so a crafted link cannot bounce anyone off-site.
  const requested = url.searchParams.get("next") ?? "/onboarding";
  const next = requested.startsWith("/") ? requested : "/onboarding";

  const supabase = await createSupabaseServerClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }

  const failed = new URL("/sign-in", url.origin);
  failed.searchParams.set("link", "expired");
  return NextResponse.redirect(failed);
}
