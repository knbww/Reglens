import { cn } from "@/lib/utils";

/**
 * The page inside the shell: one reading column and, on wide screens, a margin.
 *
 * The shell now runs close to the window, so a page that is nothing but a
 * 42rem column would still read as a strip — the width has to be *used*, not
 * merely allowed. The margin carries record data and the ways on: never
 * anything essential, so that below 1280px it drops under the column with a
 * rule above it and nothing is lost.
 */
export function Sheet({
  children,
  margin,
  className,
  columnClassName,
}: {
  children: React.ReactNode;
  margin?: React.ReactNode;
  className?: string;
  /** Caps the reading column on document pages, where measure beats width. */
  columnClassName?: string;
}) {
  if (!margin) {
    return <div className={cn("min-w-0 pb-10", className)}>{children}</div>;
  }

  return (
    <div
      className={cn(
        "grid items-start gap-x-12 gap-y-10 pb-10 xl:grid-cols-[minmax(0,1fr)_17rem]",
        className,
      )}
    >
      <div className={cn("min-w-0", columnClassName)}>{children}</div>
      <aside className="min-w-0 border-t border-line pt-6 xl:border-l xl:border-t-0 xl:pl-8 xl:pt-1">
        {margin}
      </aside>
    </div>
  );
}

/**
 * A block in the margin: a small caps-ish label, then the note. Used for the
 * score, the dates further out and the ways into the corpus.
 */
export function MarginNote({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border-b border-line pb-5 last:border-b-0 last:pb-0", className)}>
      <h2 className="text-xs font-medium text-ink-muted">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}
