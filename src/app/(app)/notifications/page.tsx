import type { Metadata } from "next";

import { NotificationList, type NotificationRow } from "@/components/app/notification-list";
import { InlineNote, PageHeader } from "@/components/ui/misc";
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

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notifications"
        description={`In-app alerts for ${business.name} — reminders inside their advance window and changes to what you monitor.`}
      />

      <InlineNote tone="info">
        RegLens delivers notifications in the app only. Email, SMS and push delivery are not implemented in this
        version.
      </InlineNote>

      <NotificationList notifications={rows} />
    </div>
  );
}
