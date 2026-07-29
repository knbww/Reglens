import { Skeleton } from "@/components/ui/misc";

export default function PoliciesLoading() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Skeleton className="h-56 w-full rounded-card" />
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-44 w-full rounded-card" />
        ))}
      </div>
    </div>
  );
}
