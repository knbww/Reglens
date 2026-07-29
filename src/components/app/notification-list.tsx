"use client";

import type { NotificationKind } from "@prisma/client";
import { Bell, Check, CheckCheck, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import {
  deleteNotification,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/actions/reminders";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAction } from "@/lib/use-action";

export type NotificationRow = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  createdAt: string;
};

const KIND_LABEL: Record<NotificationKind, string> = {
  REMINDER: "Reminder",
  POLICY_UPDATE: "Policy update",
  TASK: "Task",
  SYSTEM: "System",
};

export function NotificationList({ notifications }: { notifications: NotificationRow[] }) {
  const router = useRouter();
  const { busy: pending, run } = useAction();
  const unread = notifications.filter((n) => !n.read).length;

  function mutate(fn: () => Promise<unknown>) {
    run(async () => {
      await fn();
      router.refresh();
    });
  }

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={<Bell className="size-6" />}
        title="No notifications"
        description="Reminders inside their advance window and changes to policies you monitor will appear here."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-ink-muted tabular">
          {unread} unread of {notifications.length}
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={pending || unread === 0}
          onClick={() => mutate(() => markAllNotificationsRead())}
        >
          <CheckCheck className="size-3.5" />
          Mark all as read
        </Button>
      </div>

      <ul className="space-y-2">
        {notifications.map((notification) => (
          <li
            key={notification.id}
            className={cn(
              "rounded-card border bg-surface p-4",
              notification.read ? "border-line" : "border-brand-ring bg-brand-soft/40",
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge tone={notification.read ? "neutral" : "brand"}>
                    {KIND_LABEL[notification.kind]}
                  </Badge>
                  {!notification.read ? <Badge tone="danger">New</Badge> : null}
                  <span className="text-xs text-ink-muted">{relativeTime(notification.createdAt)}</span>
                </div>
                <p className="mt-1.5 text-sm font-medium text-ink">{notification.title}</p>
                {notification.body ? (
                  <p className="mt-0.5 text-sm leading-6 text-ink-soft">{notification.body}</p>
                ) : null}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {notification.href ? (
                <Link
                  href={notification.href}
                  onClick={() => {
                    if (!notification.read) void markNotificationRead(notification.id);
                  }}
                  className="text-xs font-medium text-brand hover:underline"
                >
                  Open
                </Link>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => mutate(() => markNotificationRead(notification.id, !notification.read))}
              >
                <Check className="size-3.5" />
                {notification.read ? "Mark unread" : "Mark read"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => mutate(() => deleteNotification(notification.id))}
              >
                <Trash2 className="size-3.5" />
                Remove
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
