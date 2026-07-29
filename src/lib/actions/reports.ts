"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { buildComplianceReport } from "@/lib/reports";
import { requireActiveBusiness } from "@/lib/session";

export async function generateReport(
  title?: string,
): Promise<{ ok: true; reportId: string } | { ok: false; error: string }> {
  const { user, business } = await requireActiveBusiness();
  const payload = await buildComplianceReport(business);

  const report = await prisma.report.create({
    data: {
      businessId: business.id,
      userId: user.id,
      title:
        title?.trim() ||
        `${business.name} compliance summary — ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`,
      kind: "compliance_summary",
      payload: payload as unknown as object,
    },
  });

  revalidatePath("/reports");
  return { ok: true, reportId: report.id };
}

export async function deleteReport(id: string): Promise<{ ok: boolean }> {
  const { business } = await requireActiveBusiness();
  await prisma.report.deleteMany({ where: { id, businessId: business.id } });
  revalidatePath("/reports");
  return { ok: true };
}
