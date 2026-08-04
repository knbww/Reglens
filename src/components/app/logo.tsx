import { cn } from "@/lib/utils";

/**
 * A lens over two lines of text, drawn in ink rather than set in a filled
 * rounded square. The square read as an app icon dropped into the page; a
 * stroke mark sits in a line of type without asking for attention.
 */
export function Logo({ className, showWordmark = true }: { className?: string; showWordmark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-ink", className)}>
      <svg
        viewBox="0 0 24 24"
        className="size-5.5 shrink-0"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
      >
        <circle cx="10.25" cy="10.25" r="6.25" strokeWidth="1.5" />
        <path d="M15 15 L20 20" strokeWidth="1.8" />
        <path d="M7.5 9 h5.5" strokeWidth="1.2" />
        <path d="M7.5 11.75 h3.25" strokeWidth="1.2" />
      </svg>
      {showWordmark ? (
        <span className="text-[15px] font-semibold tracking-tight">
          RegLens<span className="font-normal text-ink-muted"> AI</span>
        </span>
      ) : null}
    </span>
  );
}
