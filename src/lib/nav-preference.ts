/**
 * Sidebar width preference.
 *
 * Deliberately its own module: the server reads this cookie to render the
 * correct rail width on first paint, and the client writes it on toggle. Were
 * the constant exported from the `"use client"` sidebar module, the server
 * would import a client reference rather than the string and the lookup would
 * silently miss.
 */
export const NAV_COOKIE = "reglens.nav";

export type NavPreference = "rail" | "wide";

export function isCollapsed(value: string | undefined): boolean {
  return value === "rail";
}

export function navPreferenceCookie(collapsed: boolean): string {
  const preference: NavPreference = collapsed ? "rail" : "wide";
  return `${NAV_COOKIE}=${preference}; path=/; max-age=31536000; samesite=lax`;
}
