import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteReportButton, PrintButton } from "@/components/app/reports/print-button";
import { ReportView } from "@/components/app/reports/report-view";
import { prisma } from "@/lib/prisma";
import type { ComplianceReport } from "@/lib/reports";
import { requireActiveBusiness } from "@/lib/session";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const report = await prisma.report.findUnique({ where: { id }, select: { title: true } });
  return { title: report?.title ?? "Report" };
}

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { business } = await requireActiveBusiness();

  const report = await prisma.report.findFirst({ where: { id, businessId: business.id } });
  if (!report) notFound();

  const payload = report.payload as unknown as ComplianceReport;

  return (
    <div className="space-y-4">
      <div className="print-hidden flex flex-wrap items-center justify-between gap-3">
        <Link href="/reports" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft className="size-4" />
          All reports
        </Link>
        <div className="flex items-center gap-2">
          <PrintButton />
          <DeleteReportButton reportId={report.id} title={report.title} />
        </div>
      </div>

      <ReportView report={payload} title={report.title} />
    </div>
  );
}
