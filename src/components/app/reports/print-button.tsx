"use client";

import { Printer, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { deleteReport } from "@/lib/actions/reports";
import { useAction } from "@/lib/use-action";

export function PrintButton() {
  return (
    <Button type="button" variant="secondary" onClick={() => window.print()}>
      <Printer className="size-4" />
      Print or save as PDF
    </Button>
  );
}

export function DeleteReportButton({ reportId, title }: { reportId: string; title: string }) {
  const router = useRouter();
  const { busy: pending, run } = useAction();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(`Delete the report "${title}"?`)) return;
        run(async () => {
          await deleteReport(reportId);
          router.push("/reports");
          router.refresh();
        });
      }}
    >
      <Trash2 className="size-3.5" />
      Delete
    </Button>
  );
}
