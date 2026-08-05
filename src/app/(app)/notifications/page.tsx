/*
 * The question this page answers:
 * "What has RegLens told me that I have not dealt with?"
 * One primary action: clear the list.
 */
import type { Metadata } from "next";

import { NotificationList, type NotificationRow } from "@/components/app/notification-list";
import { prisma } from "@/lib/prisma";
import { requireActiveBusiness } from "@/lib/session";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const { user, business } = await requireActiveBusiness();

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id, businessId: business.id },
    orderBy: [{ read: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  const rows: NotificationRow[] = notifications.map((n) => ({
    id: n.id,
    kind: n.kind,
    title: n.title,
    body: n.body,
    href: n.href,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  }));

  const unread = rows.filter((n) => !n.read).length;
  const headline =
    rows.length === 0
      ? "Nothing has come in"
      : unread === 0
        ? "You have read everything"
        : unread === 1
          ? "One notification you have not read"
          : `${unread} notifications you have not read`;

  return (
    <div className="pb-10">
      <header className="rise pb-6">
        <p className="text-xs text-ink-muted">{business.name}</p>
        <h1 className="mt-3 text-display font-semibold text-balance text-ink">{headline}</h1>
        <p className="mt-3 max-w-2xl text-[13px] leading-6 text-ink-soft">
          Reminders inside their advance window, and changes to the policies you monitor. RegLens delivers
          these in the app only — there is no email, SMS or push in this version.
        </p>
      </header>

      <NotificationList notifications={rows} />
    </div>
  );
}
