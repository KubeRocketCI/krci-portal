import type { SecurityCodebaseSummary, SecurityCounts } from "@my-project/shared";
import { sumCounts, type FindingsEntry, type FindingsScope } from "../../utils";
import { EntryCompositionCard } from "./EntryCompositionCard";
import { ScopeComparisonCard } from "./ScopeComparisonCard";
import { SeverityDonutCard } from "./SeverityDonutCard";

interface SecurityChartsProps {
  summary: SecurityCodebaseSummary;
  /** Ordered entries of `scope`. */
  entries: FindingsEntry[];
  /** Scope of the donut and the per-entry chart. */
  scope: FindingsScope;
  /** Totals of `scope`. */
  counts: SecurityCounts;
}

function getScopeEntries(summary: SecurityCodebaseSummary): FindingsEntry[] {
  const scopes: FindingsEntry[] = [];
  const codeEntries = summary.ci.filter((entry) => entry.kind === "code");
  const imageEntries = summary.ci.filter((entry) => entry.kind === "image");

  if (codeEntries.length > 0) {
    scopes.push({ key: "ci-code", label: "CI code", counts: sumCounts(codeEntries) });
  }
  if (imageEntries.length > 0) {
    scopes.push({ key: "ci-image", label: "CI image", counts: sumCounts(imageEntries) });
  }
  if (summary.runtime.length > 0) {
    scopes.push({ key: "runtime", label: "Runtime", counts: sumCounts(summary.runtime) });
  }

  return scopes;
}

/** Charts of the Security tab. Loaded lazily so recharts stays out of the page chunk. */
export function SecurityCharts({ summary, entries, scope, counts }: SecurityChartsProps) {
  const scopes = getScopeEntries(summary);

  return (
    <section aria-label="Charts" className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SeverityDonutCard counts={counts} scope={scope} />
        {scopes.length > 1 && <ScopeComparisonCard scopes={scopes} />}
      </div>
      {entries.length > 0 && <EntryCompositionCard key={scope} entries={entries} scope={scope} />}
    </section>
  );
}
