"use client";

import { FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { generateReport } from "@/lib/actions/reports";
import { useAction } from "@/lib/use-action";

export function GenerateReportButton({
  variant = "secondary",
  size = "md",
  label = "Generate report",
  className,
}: {
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const { busy: pending, run } = useAction();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        disabled={pending}
        onClick={() =>
          run(async () => {
            setError(null);
            const result = await generateReport();
            if (!result.ok) {
              setError(result.error);
              return;
            }
            router.push(`/reports/${result.reportId}`);
          })
        }
      >
        <FileText className="size-4" />
        {pending ? "Generating…" : label}
      </Button>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </>
  );
}
