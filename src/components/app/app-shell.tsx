import { Bell } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { BusinessSwitcher } from "@/components/app/business-switcher";
import { Logo } from "@/components/app/logo";
import { AccountMenu } from "@/components/app/nav/account-menu";
import { MobileTabBar } from "@/components/app/nav/mobile-tab-bar";
import { TopNav } from "@/components/app/nav/top-nav";
import { QuickSearch } from "@/components/app/quick-search";
import { EMPTY_NAV_COUNTS, getNavCounts, getUnreadNotificationCount } from "@/lib/queries";
import { getActiveBusiness, listBusinesses, requireUser } from "@/lib/session";
import { SHORT_DISCLAIMER } from "@/lib/taxonomy";

/**
 * The masthead every signed-in page hangs from.
 *
 * A register has a masthead, not a filing cabinet down one side: the title,
 * where you are, and the ways through — on one line, above a single rule. That
 * rule is the only line the frame draws before the page has said anything.
 */
export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [businesses, activeBusiness] = await Promise.all([
    listBusinesses(user.id),
    getActiveBusiness(user.id),
  ]);

  const [unread, counts] = activeBusiness
    ? await Promise.all([
        getUnreadNotificationCount(user.id, activeBusiness.id),
        getNavCounts(activeBusiness),
      ])
    : [0, EMPTY_NAV_COUNTS];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="print-hidden sticky top-0 z-30 border-b border-line bg-canvas/95 backdrop-blur">
        <div className="mx-auto w-full max-w-6xl px-5 lg:px-8">
          <div className="flex h-14 items-center gap-4">
            <Link href="/dashboard" aria-label="RegLens home" className="shrink-0">
              <Logo />
            </Link>

            {businesses.length > 1 ? (
              <div className="hidden min-w-0 max-w-[13rem] md:block">
                <BusinessSwitcher businesses={businesses} activeId={activeBusiness?.id ?? null} />
              </div>
            ) : null}

            <TopNav counts={counts} className="ml-2 hidden lg:flex" />

            <div className="ml-auto flex shrink-0 items-center gap-1">
              <Suspense fallback={<div className="hidden h-9 w-56 sm:block" />}>
                <QuickSearch className="hidden w-56 sm:block" />
              </Suspense>

              <Link
                href="/notifications"
                aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
                className="relative flex size-9 items-center justify-center rounded-md text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink"
              >
                <Bell className="size-4.5" />
                {unread > 0 ? (
                  <span
                    aria-hidden
                    className="absolute right-2 top-2 size-1.5 rounded-full bg-ink ring-2 ring-canvas"
                  />
                ) : null}
              </Link>

              <AccountMenu
                email={user.email}
                fullName={user.fullName}
                plan={user.plan}
                placement="down"
                expanded={false}
              />
            </div>
          </div>
        </div>
      </header>

      <Suspense>
        <QuickSearch className="print-hidden border-b border-line px-5 py-2 sm:hidden" />
      </Suspense>

      <main className="min-w-0 flex-1 px-5 pb-16 pt-8 lg:px-8">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>

      <footer className="print-hidden px-5 pb-10 text-xs text-ink-muted lg:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-line pt-5">
          <p className="max-w-2xl leading-5">{SHORT_DISCLAIMER}</p>
          <Link href="/legal" className="transition-colors hover:text-ink">
            Full disclaimer
          </Link>
        </div>
      </footer>

      {/* Clears the fixed tab bar so the footer is never trapped under it. */}
      <div aria-hidden className="h-14 shrink-0 lg:hidden" />

      <MobileTabBar counts={counts} />
    </div>
  );
}
