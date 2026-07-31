import { Bell } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";

import { Logo } from "@/components/app/logo";
import { AccountMenu } from "@/components/app/nav/account-menu";
import { AppSidebar } from "@/components/app/nav/app-sidebar";
import { MobileTabBar } from "@/components/app/nav/mobile-tab-bar";
import { QuickSearch } from "@/components/app/quick-search";
import { isCollapsed, NAV_COOKIE } from "@/lib/nav-preference";
import { EMPTY_NAV_COUNTS, getNavCounts, getUnreadNotificationCount } from "@/lib/queries";
import { getActiveBusiness, listBusinesses, requireUser } from "@/lib/session";
import { SHORT_DISCLAIMER } from "@/lib/taxonomy";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [businesses, activeBusiness, cookieStore] = await Promise.all([
    listBusinesses(user.id),
    getActiveBusiness(user.id),
    cookies(),
  ]);

  const [unread, counts] = activeBusiness
    ? await Promise.all([
        getUnreadNotificationCount(user.id, activeBusiness.id),
        getNavCounts(activeBusiness),
      ])
    : [0, EMPTY_NAV_COUNTS];

  const collapsed = isCollapsed(cookieStore.get(NAV_COOKIE)?.value);

  return (
    <div className="flex min-h-screen">
      <AppSidebar
        businesses={businesses}
        activeBusinessId={activeBusiness?.id ?? null}
        counts={counts}
        email={user.email}
        fullName={user.fullName}
        plan={user.plan}
        initialCollapsed={collapsed}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="print-hidden sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-2.5 sm:px-6">
            <Link href="/dashboard" aria-label="RegLens home" className="lg:hidden">
              <Logo showWordmark={false} />
            </Link>

            <Suspense fallback={<div className="h-9 max-w-md flex-1" />}>
              <QuickSearch className="hidden max-w-md flex-1 sm:block" />
            </Suspense>

            <div className="ml-auto flex items-center gap-1.5">
              {/* The only door to notifications — the duplicate sidebar row is gone. */}
              <Link
                href="/notifications"
                aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
                className="relative flex size-9 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink"
              >
                <Bell className="size-4.5" />
                {unread > 0 ? (
                  <span className="absolute right-1.5 top-1.5 flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-4 text-white tabular">
                    {unread > 9 ? "9+" : unread}
                  </span>
                ) : null}
              </Link>

              {/* Desktop keeps the account menu in the sidebar foot. In the
                  header there is no room for the name block — avatar only. */}
              <div className="lg:hidden">
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
          <Suspense>
            <QuickSearch className="border-t border-line px-4 py-2 sm:hidden" />
          </Suspense>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>

        <footer className="print-hidden border-t border-line px-4 py-4 text-xs text-ink-muted sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-2">
            <p className="max-w-3xl leading-5">{SHORT_DISCLAIMER}</p>
            <Link href="/legal" className="underline underline-offset-2 hover:text-ink">
              Full disclaimer
            </Link>
          </div>
        </footer>

        {/* Clears the fixed tab bar so the footer is never trapped under it. */}
        <div aria-hidden className="h-14 shrink-0 lg:hidden" />
      </div>

      <MobileTabBar counts={counts} />
    </div>
  );
}
