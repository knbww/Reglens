import { Badge } from "@/components/ui/badge";
import { formatDate, formatDateTime } from "@/lib/format";
import type { ComplianceReport } from "@/lib/reports";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="print-break space-y-2 border-t border-line pt-5">
      <h2 className="text-sm font-semibold tracking-tight text-ink">{title}</h2>
      {children}
    </section>
  );
}

function Row({ term, value }: { term: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-1 text-sm">
      <dt className="w-48 shrink-0 text-ink-muted">{term}</dt>
      <dd className="min-w-0 flex-1 text-ink-soft">{value}</dd>
    </div>
  );
}

export function ReportView({ report, title }: { report: ComplianceReport; title: string }) {
  return (
    <article className="print-full space-y-5 rounded-card border border-line bg-surface p-6">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-brand">RegLens AI · Compliance summary</p>
        <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
        <p className="text-sm text-ink-muted">Generated {formatDateTime(report.generatedAt)}</p>
      </header>

      <Section title="Company profile">
        <dl className="divide-y divide-line">
          <Row term="Company" value={report.business.name} />
          <Row term="Description" value={report.business.description || "—"} />
          <Row term="Location" value={report.business.location} />
          <Row term="Organisation type" value={report.business.orgType} />
          <Row term="Size" value={`${report.business.sizeBand} (${report.business.employeeCount} employees)`} />
          <Row term="Industry" value={report.business.industry} />
          <Row term="Website" value={report.business.website ?? "—"} />
          <Row
            term="Compliance priorities"
            value={report.business.priorities.length ? report.business.priorities.join(", ") : "None selected"}
          />
          <Row
            term="Dedicated compliance staff"
            value={report.business.hasComplianceStaff ? "Yes" : "No"}
          />
          <Row term="Expansion" value={report.business.expansion ?? "None recorded"} />
          <Row
            term="Profile completeness"
            value={
              <>
                {report.profileCompletion.percent}%
                {report.profileCompletion.missing.length > 0
                  ? ` — missing: ${report.profileCompletion.missing.join(", ")}`
                  : ""}
              </>
            }
          />
        </dl>
      </Section>

      <Section title="Monitored jurisdictions">
        <dl className="divide-y divide-line">
          <Row
            term="Operating"
            value={report.jurisdictions.operating.length ? report.jurisdictions.operating.join("; ") : "None recorded"}
          />
          <Row
            term="Expansion targets"
            value={report.jurisdictions.targets.length ? report.jurisdictions.targets.join("; ") : "None recorded"}
          />
        </dl>
      </Section>

      <Section title="Policy Risk Score">
        <p className="text-sm text-ink-soft">
          <span className="text-2xl font-semibold text-ink tabular">{report.risk.score}</span>
          <span className="ml-2 text-ink-muted">/ 100 · {report.risk.level} exposure</span>
        </p>
        <p className="text-sm leading-6 text-ink-soft">{report.risk.summary}</p>
        <ul className="mt-2 space-y-1">
          {report.risk.factors.map((factor) => (
            <li key={factor.label} className="text-sm text-ink-soft">
              <span className={factor.direction === "increase" ? "text-danger" : "text-success"}>
                {factor.direction === "increase" ? "+" : "−"}
                {factor.points}
              </span>{" "}
              <span className="font-medium text-ink">{factor.label}</span> — {factor.detail}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Most relevant policies">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-ink-muted">
                <th className="py-2 pr-3 font-medium">Policy</th>
                <th className="py-2 pr-3 font-medium">Jurisdiction</th>
                <th className="py-2 pr-3 font-medium">Agency</th>
                <th className="py-2 font-medium">Relevance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {report.relevantPolicies.map((policy) => (
                <tr key={policy.id} className="align-top">
                  <td className="py-2 pr-3">
                    <span className="font-medium text-ink">{policy.title}</span>
                    <span className="mt-0.5 block text-xs text-ink-muted">{policy.summary}</span>
                  </td>
                  <td className="py-2 pr-3 text-ink-soft">{policy.jurisdiction}</td>
                  <td className="py-2 pr-3 text-ink-soft">{policy.agency}</td>
                  <td className="py-2 text-ink-soft tabular">{policy.relevance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Recent regulatory changes">
        {report.recentChanges.length === 0 ? (
          <p className="text-sm text-ink-muted">No changes detected against monitored items.</p>
        ) : (
          <ul className="space-y-2">
            {report.recentChanges.map((change) => (
              <li key={`${change.title}-${change.detectedAt}`} className="text-sm">
                <span className="font-medium text-ink">{change.title}</span>
                <span className="ml-2 text-xs text-ink-muted">
                  {change.type.toLowerCase().replace(/_/g, " ")} · {change.importance.toLowerCase()} ·{" "}
                  {formatDate(change.detectedAt)} · {change.reviewState.toLowerCase()}
                </span>
                <span className="mt-0.5 block text-xs text-ink-muted">{change.policyTitle}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Open tasks">
        {report.openTasks.length === 0 ? (
          <p className="text-sm text-ink-muted">No open tasks.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-ink-muted">
                  <th className="py-2 pr-3 font-medium">Task</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 pr-3 font-medium">Priority</th>
                  <th className="py-2 pr-3 font-medium">Due</th>
                  <th className="py-2 font-medium">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {report.openTasks.map((task) => (
                  <tr key={task.title}>
                    <td className="py-2 pr-3 text-ink">{task.title}</td>
                    <td className="py-2 pr-3 text-ink-soft">
                      {task.status.toLowerCase().replace(/_/g, " ")}
                    </td>
                    <td className="py-2 pr-3 text-ink-soft">{task.priority.toLowerCase()}</td>
                    <td className="py-2 pr-3 text-ink-soft tabular">
                      {task.dueDate ? formatDate(task.dueDate) : "—"}
                    </td>
                    <td className="py-2 text-ink-soft tabular">{task.progress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Upcoming deadlines">
        {report.upcomingDeadlines.length === 0 ? (
          <p className="text-sm text-ink-muted">No deadlines tracked.</p>
        ) : (
          <ul className="space-y-1.5">
            {report.upcomingDeadlines.map((deadline) => (
              <li key={`${deadline.title}-${deadline.dueDate}`} className="text-sm text-ink-soft">
                <span className="font-medium text-ink">{deadline.title}</span> —{" "}
                <span className="tabular">{formatDate(deadline.dueDate)}</span>{" "}
                <span className="text-ink-muted">
                  ({deadline.daysRemaining < 0
                    ? `${Math.abs(deadline.daysRemaining)} days overdue`
                    : `${deadline.daysRemaining} days remaining`}
                  , {deadline.kind.toLowerCase().replace(/_/g, " ")})
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Completed actions">
        {report.completedTasks.length === 0 ? (
          <p className="text-sm text-ink-muted">Nothing completed yet.</p>
        ) : (
          <ul className="space-y-1">
            {report.completedTasks.map((task) => (
              <li key={task.title} className="text-sm text-ink-soft">
                {task.title}
                {task.completedAt ? (
                  <span className="ml-2 text-xs text-ink-muted tabular">{formatDate(task.completedAt)}</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Recommended next steps">
        <ol className="space-y-1.5">
          {report.nextSteps.map((step, index) => (
            <li key={step} className="flex gap-2 text-sm text-ink-soft">
              <span className="font-medium text-ink tabular">{index + 1}.</span>
              {step}
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Disclaimer">
        <p className="text-xs leading-5 text-ink-muted">{report.disclaimer}</p>
        <p className="mt-2 text-xs leading-5 text-ink-muted">
          Policy records in this report are illustrative sample data summarising real regulatory frameworks.
          Each links to the responsible agency. Verify anything you intend to rely on.
        </p>
        <div className="mt-2">
          <Badge tone="neutral">Sample dataset</Badge>
        </div>
      </Section>
    </article>
  );
}

export function reportSubtitle(report: ComplianceReport): string {
  const jurisdictions = report.jurisdictions.operating.length;
  return `${report.business.industry} · ${jurisdictions} operating ${
    jurisdictions === 1 ? "jurisdiction" : "jurisdictions"
  } · ${report.risk.level} risk · ${report.openTasks.length} open tasks`;
}
