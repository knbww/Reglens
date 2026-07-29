import Link from "next/link";
import * as React from "react";

import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-ink-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center rounded-card border border-dashed border-line-strong bg-surface-muted px-6 py-12 text-center", className)}>
      {icon ? <div className="mb-3 text-ink-muted">{icon}</div> : null}
      <p className="text-sm font-medium text-ink">{title}</p>
      {description ? <p className="mt-1 max-w-md text-sm text-ink-muted">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = "neutral",
  href,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "neutral" | "success" | "warning" | "danger";
  href?: string;
}) {
  const toneClass = {
    neutral: "text-ink",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
  }[tone];

  const body = (
    <>
      <p className="text-xs font-medium text-ink-muted">{label}</p>
      <p className={cn("mt-1.5 text-2xl font-semibold tabular tracking-tight", toneClass)}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-muted">{hint}</p> : null}
    </>
  );

  const className =
    "block rounded-card border border-line bg-surface px-4 py-3.5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]";

  if (href) {
    return (
      <Link href={href} className={cn(className, "transition-colors hover:border-brand-ring")}>
        {body}
      </Link>
    );
  }
  return <div className={className}>{body}</div>;
}

export function Section({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-ink">{title}</h2>
          {description ? <p className="mt-0.5 text-sm text-ink-muted">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

export function DefinitionList({ items }: { items: { term: string; value: React.ReactNode }[] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.term} className="min-w-0">
          <dt className="text-xs font-medium text-ink-muted">{item.term}</dt>
          <dd className="mt-0.5 text-sm text-ink break-words">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ProgressBar({
  value,
  tone = "brand",
  className,
  label,
}: {
  value: number;
  tone?: "brand" | "success" | "warning" | "danger";
  className?: string;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const bg = {
    brand: "bg-brand",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
  }[tone];
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-line", className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className={cn("h-full rounded-full transition-[width]", bg)} style={{ width: `${clamped}%` }} />
    </div>
  );
}

export function InlineNote({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "info" | "warning";
  className?: string;
}) {
  const toneClass = {
    neutral: "border-line bg-surface-muted text-ink-soft",
    info: "border-info/20 bg-info-soft text-info",
    warning: "border-warning/25 bg-warning-soft text-warning",
  }[tone];
  return (
    <p className={cn("rounded-lg border px-3 py-2 text-xs leading-5", toneClass, className)}>{children}</p>
  );
}
