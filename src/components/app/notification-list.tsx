"use client";

import type { NotificationKind } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
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

/**
 * A list you can empty without leaving it.
 *
 * Every row carries its own disposal — read it, un-read it, or throw it away —
 * and the effect is applied locally the instant you act, so the count above
 * falls at the speed of the click rather than at the speed of the database.
 * Dismissed rows leave with the one animation in the product that means
 * something.
 */
export function NotificationList({ notifications }: { notifications: NotificationRow[] }) {
  const router = useRouter();
  const { busy: pending, run } = useAction();
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [readState, setReadState] = useState<Record<string, boolean>>({});
  const [leaving, setLeaving] = useState<string | null>(null);

  const visible = notifications
    .filter((n) => !removed.has(n.id))
    .map((n) => ({ ...n, read: readState[n.id] ?? n.read }));

  const unread = visible.filter((n) => !n.read).length;

  function setRead(id: string, read: boolean) {
    setReadState((prev) => ({ ...prev, [id]: read }));
    run(async () => {
      await markNotificationRead(id, read);
      router.refresh();
    });
  }

  function markEverythingRead() {
    setReadState((prev) => {
      const next = { ...prev };
      for (const n of visible) next[n.id] = true;
      return next;
    });
    run(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  }

  function dismiss(id: string) {
    setLeaving(id);
    run(async () => {
      await deleteNotification(id);
      // Let the row finish leaving before it is taken out of the list.
      await new Promise((resolve) => setTimeout(resolve, 170));
      setRemoved((prev) => new Set(prev).add(id));
      setLeaving(null);
      router.refresh();
    });
  }

  if (visible.length === 0) {
    return (
      <div className="rise py-10">
        <p className="text-title font-semibold text-ink">Nothing waiting.</p>
        <p className="mt-2 max-w-md text-[15px] leading-7 text-ink-soft">
          Reminders inside their advance window and changes to policies you monitor will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="rise">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <p className="tabular text-xs text-ink-muted">
          {unread} unread of {visible.length}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending || unread === 0}
          onClick={markEverythingRead}
        >
          Mark all as read
        </Button>
      </div>

      <ul>
        {visible.map((notification) => (
          <li
            key={notification.id}
            className={cn(
              "border-b border-line py-5",
              leaving === notification.id && "dispose",
            )}
          >
            <p className="text-xs text-ink-muted">
              {KIND_LABEL[notification.kind]} · {relativeTime(notification.createdAt)}
              {notification.read ? null : <span className="font-medium text-ink"> · Unread</span>}
            </p>

            <p
              className={cn(
                "mt-1.5 text-[15px]",
                notification.read ? "text-ink-soft" : "font-medium text-ink",
              )}
            >
              {notification.title}
            </p>

            {notification.body ? (
              <p className="mt-1 max-w-2xl text-[13px] leading-6 text-ink-soft">{notification.body}</p>
            ) : null}

            <div className="mt-3 -ml-2.5 flex flex-wrap items-center gap-x-1 gap-y-1">
              {notification.href ? (
                <Link
                  href={notification.href}
                  onClick={() => {
                    if (!notification.read) setRead(notification.id, true);
                  }}
                  className="rounded-lg px-2.5 py-1 text-[13px] font-medium text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink"
                >
                  Open
                </Link>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => setRead(notification.id, !notification.read)}
              >
                {notification.read ? "Mark unread" : "Mark read"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => dismiss(notification.id)}
              >
                Dismiss
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
