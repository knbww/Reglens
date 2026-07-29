import type { Metadata } from "next";

import { AnalystWorkspace } from "@/components/app/analyst/analyst-workspace";
import { prisma } from "@/lib/prisma";
import { requireActiveBusiness } from "@/lib/session";

export const metadata: Metadata = { title: "AI Policy Analyst" };

export default async function AnalystPage({
  searchParams,
}: {
  searchParams: Promise<{ policy?: string }>;
}) {
  const params = await searchParams;
  const { business } = await requireActiveBusiness();

  const policy = params.policy
    ? await prisma.policy.findUnique({ where: { id: params.policy }, select: { id: true, title: true } })
    : null;

  return (
    <AnalystWorkspace
      businessName={business.name}
      conversationId={null}
      policyId={policy?.id ?? null}
      policyTitle={policy?.title ?? null}
      initialTurns={[]}
    />
  );
}
