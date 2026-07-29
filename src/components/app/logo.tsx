import { cn } from "@/lib/utils";

export function Logo({ className, showWordmark = true }: { className?: string; showWordmark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg viewBox="0 0 24 24" className="size-6 shrink-0" aria-hidden="true">
        <rect width="24" height="24" rx="6" fill="var(--color-brand)" />
        <circle cx="10.5" cy="10.5" r="4.25" stroke="white" strokeWidth="1.6" fill="none" />
        <path d="M13.8 13.8 L18 18" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M8.4 10.5 h4.2" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
      {showWordmark ? (
        <span className="text-[15px] font-semibold tracking-tight text-ink">
          RegLens<span className="text-brand"> AI</span>
        </span>
      ) : null}
    </span>
  );
}
