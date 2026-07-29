import { FileText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { GenerateReportButton } from "@/components/app/generate-report-button";
import { DeleteReportButton } from "@/components/app/reports/print-button";
import { reportSubtitle } from "@/components/app/reports/report-view";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, InlineNote, PageHeader } from "@/components/ui/misc";
import { formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import type { ComplianceReport } from "@/lib/reports";
import { requireActiveBusiness } from "@/lib/session";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  const { business } = await requireActiveBusiness();

  const reports = await prisma.report.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        description={`Point-in-time compliance summaries for ${business.name}, saved so you can compare how the picture changes.`}
        actions={<GenerateReportButton variant="primary" label="Generate compliance summary" />}
      />

      <InlineNote>
        A report captures your profile, jurisdictions, risk score, most relevant policies, recent changes, open
        tasks, deadlines and next steps at the moment it is generated. Open one and use “Print or save as PDF”
        for a shareable copy.
      </InlineNote>

      {reports.length === 0 ? (
        <EmptyState
          icon={<FileText className="size-6" />}
          title="No reports yet"
          description="Generate your first compliance summary — it takes a snapshot of everything RegLens currently knows about your business."
          action={<GenerateReportButton label="Generate your first report" />}
        />
      ) : (
        <ul className="space-y-2">
          {reports.map((report) => {
            const payload = report.payload as unknown as ComplianceReport;
            return (
              <li key={report.id}>
                <Card className="transition-colors hover:border-brand-ring">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/reports/${report.id}`} className="text-sm font-medium text-ink hover:text-brand">
                        {report.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {formatDateTime(report.createdAt)} · {reportSubtitle(payload)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/reports/${report.id}`}
                        className="rounded-lg border border-line-strong bg-surface px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-surface-muted"
                      >
                        Open
                      </Link>
                      <DeleteReportButton reportId={report.id} title={report.title} />
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
