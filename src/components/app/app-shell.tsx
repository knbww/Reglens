import { Bell } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { BusinessSwitcher } from "@/components/app/business-switcher";
import { Logo } from "@/components/app/logo";
import { AccountMenu } from "@/components/app/nav/account-menu";
import { MobileTabBar } from "@/components/app/nav/mobile-tab-bar";
import { TopNav } from "@/components/app/nav/top-nav";
import { QuickSearch } from "@/components/app/quick-search";
import { accessFor, trialRemaining } from "@/lib/billing";
import { EMPTY_NAV_COUNTS, getNavCounts, getUnreadNotificationCount } from "@/lib/queries";
import { getActiveBusiness, listBusinesses, requireUser } from "@/lib/session";
import { SHORT_DISCLAIMER } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";

/**
 * One measure for the masthead, the sheet and the colophon.
 *
 * It was 72rem, which on a 1500px screen parked every page in the middle of
 * 350px of empty leaf on each side — and the pages themselves then capped
 * again at 42rem, so the product read as a narrow strip with a wide frame
 * around it. The sheet now runs close to the window and the *reading column*
 * inside it does the job the old max-width was pretending to do.
 */
const SHELL_WIDTH = "mx-auto w-full max-w-[86rem] px-4 sm:px-6 lg:px-8";

/**
 * The masthead every signed-in page hangs from.
 *
 * A register has a masthead, not a filing cabinet down one side: the title,
 * where you are, and the ways through — on one line, above a single rule. That
 * rule is the only line the frame draws before the page has said anything.
 */
export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const access = accessFor(user);
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
        <div className={SHELL_WIDTH}>
          <div className="flex h-14 items-center gap-4">
            <Link href="/dashboard" aria-label="RegLens home" className="shrink-0">
              <Logo />
            </Link>

            {/* Six destinations now sit on this line, so the switcher and the
                search field give their width back until the window can spare
                it rather than crowding the navigation. */}
            {businesses.length > 1 ? (
              <div className="hidden min-w-0 max-w-[13rem] md:block lg:hidden xl:block">
                <BusinessSwitcher businesses={businesses} activeId={activeBusiness?.id ?? null} />
              </div>
            ) : null}

            <TopNav counts={counts} className="ml-1 hidden lg:flex" />

            <div className="ml-auto flex shrink-0 items-center gap-1">
              {/* The clock, stated once, where it cannot be mistaken for an
                  alert about the reader's compliance work. */}
              {access.state === "trial" ? (
                <Link
                  href="/pricing"
                  className="mr-1 hidden whitespace-nowrap text-[13px] text-ink-muted transition-colors hover:text-ink lg:block"
                >
                  Trial · {trialRemaining(access.trialEndsAt)}
                </Link>
              ) : null}

              <Suspense fallback={<div className="hidden h-9 w-44 sm:block xl:w-56" />}>
                <QuickSearch className="hidden w-44 sm:block xl:w-56" />
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
        <QuickSearch className="print-hidden border-b border-line px-4 py-2 sm:hidden" />
      </Suspense>

      <main className={cn(SHELL_WIDTH, "min-w-0 flex-1 pb-16 pt-8")}>{children}</main>

      <footer className={cn(SHELL_WIDTH, "print-hidden pb-10 text-xs text-ink-muted")}>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-line pt-5">
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
