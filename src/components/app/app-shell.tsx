import { Bell, Menu } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { BusinessSwitcher } from "@/components/app/business-switcher";
import { Logo } from "@/components/app/logo";
import { QuickSearch } from "@/components/app/quick-search";
import { SidebarNav } from "@/components/app/sidebar-nav";
import { UserMenu } from "@/components/app/user-menu";
import { getUnreadNotificationCount } from "@/lib/queries";
import { getActiveBusiness, listBusinesses, requireUser } from "@/lib/session";
import { SHORT_DISCLAIMER } from "@/lib/taxonomy";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [businesses, activeBusiness] = await Promise.all([
    listBusinesses(user.id),
    getActiveBusiness(user.id),
  ]);
  const unread = activeBusiness ? await getUnreadNotificationCount(user.id, activeBusiness.id) : 0;

  const sidebar = (
    <div className="flex h-full flex-col gap-5 p-4">
      <Link href="/dashboard" className="px-1">
        <Logo />
      </Link>
      <BusinessSwitcher businesses={businesses} activeId={activeBusiness?.id ?? null} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <SidebarNav unreadCount={unread} />
      </div>
      <p className="border-t border-line px-1 pt-3 text-[11px] leading-4 text-ink-muted">{SHORT_DISCLAIMER}</p>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="print-hidden hidden w-64 shrink-0 border-r border-line bg-surface lg:block">
        <div className="sticky top-0 h-screen">{sidebar}</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="print-hidden sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-2.5 sm:px-6">
            {/* Mobile drawer, CSS-only so it works without client state */}
            <details className="group relative lg:hidden">
              <summary
                className="flex size-9 cursor-pointer list-none items-center justify-center rounded-lg text-ink-soft hover:bg-surface-muted"
                aria-label="Open navigation"
              >
                <Menu className="size-5" />
              </summary>
              <div className="fixed inset-0 top-[57px] z-40 bg-canvas">
                <div className="h-full w-72 border-r border-line bg-surface">{sidebar}</div>
              </div>
            </details>

            <Link href="/dashboard" className="lg:hidden">
              <Logo showWordmark={false} />
            </Link>

            <Suspense fallback={<div className="h-9 max-w-md flex-1" />}>
              <QuickSearch className="hidden max-w-md flex-1 sm:block" />
            </Suspense>

            <div className="ml-auto flex items-center gap-1.5">
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
              <UserMenu email={user.email} fullName={user.fullName} plan={user.plan} />
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
      </div>
    </div>
  );
}
