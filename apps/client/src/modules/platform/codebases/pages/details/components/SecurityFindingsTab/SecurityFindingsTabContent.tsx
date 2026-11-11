import { Suspense, useMemo, useState } from "react";
import type { SecurityCodebaseSummary } from "@my-project/shared";
import { ShieldCheck } from "lucide-react";
import { EmptyList } from "@/core/components/EmptyList";
import { Alert } from "@/core/components/ui/alert";
import { Skeleton } from "@/core/components/ui/skeleton";
import { lazyPreloadable } from "@/core/utils/lazyPreloadable";
import { getSecurityErrorMessage } from "@/modules/platform/security/components/defectdojo/utils";
import { SecurityEntryList } from "./components/SecurityEntryList";
import { SecurityHeader } from "./components/SecurityHeader";
import { SecurityTotals } from "./components/SecurityTotals";
import {
  getCiEntries,
  getDefaultScope,
  getLastUpdated,
  getRuntimeEntries,
  sumCounts,
  type FindingsScope,
} from "./utils";

// The chart chunk (recharts) loads on first render. Keep chart imports out of this file.
const LazySecurityCharts = lazyPreloadable(() => import("./components/SecurityCharts"), "SecurityCharts");

export interface SecurityFindingsTabContentProps {
  clusterName: string;
  namespace: string;
  summary: SecurityCodebaseSummary | undefined;
  isLoading: boolean;
  error: Error | null;
}

type RouteContext = Pick<SecurityFindingsTabContentProps, "clusterName" | "namespace">;

function LoadingState() {
  return (
    <div className="flex flex-col gap-4" role="status" aria-label="Loading security findings">
      <Skeleton className="h-10 w-full" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-20" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function FindingsView({ summary, clusterName, namespace }: { summary: SecurityCodebaseSummary } & RouteContext) {
  const [selectedScope, setSelectedScope] = useState<FindingsScope>(() => getDefaultScope(summary));

  const ciEntries = useMemo(() => getCiEntries(summary.ci), [summary.ci]);
  const runtimeEntries = useMemo(() => getRuntimeEntries(summary.runtime), [summary.runtime]);

  const availableScopes: FindingsScope[] = [];
  if (runtimeEntries.length > 0) {
    availableScopes.push("runtime");
  }
  if (ciEntries.length > 0) {
    availableScopes.push("ci");
  }

  const scope = availableScopes.includes(selectedScope) ? selectedScope : availableScopes[0];
  const counts = useMemo(
    () => sumCounts(scope === "runtime" ? runtimeEntries : ciEntries),
    [scope, runtimeEntries, ciEntries]
  );

  return (
    <div className="flex flex-col gap-6">
      <SecurityHeader link={summary.link} lastUpdated={getLastUpdated(summary)} />
      <SecurityTotals
        counts={counts}
        scope={scope}
        availableScopes={availableScopes}
        onScopeChange={setSelectedScope}
      />
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <LazySecurityCharts
          summary={summary}
          entries={scope === "runtime" ? runtimeEntries : ciEntries}
          scope={scope}
          counts={counts}
        />
      </Suspense>
      {ciEntries.length > 0 && (
        <SecurityEntryList title="CI" entries={ciEntries} clusterName={clusterName} namespace={namespace} />
      )}
      {runtimeEntries.length > 0 && (
        <SecurityEntryList title="Runtime" entries={runtimeEntries} clusterName={clusterName} namespace={namespace} />
      )}
    </div>
  );
}

/** Security findings of a codebase: totals, charts, CI scans and the runtime state of each environment. */
export function SecurityFindingsTabContent({
  clusterName,
  namespace,
  summary,
  isLoading,
  error,
}: SecurityFindingsTabContentProps) {
  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <Alert variant="destructive" title="Failed to load security findings">
        {getSecurityErrorMessage(error)}
      </Alert>
    );
  }

  if (!summary) {
    return null;
  }

  const isNotScanned = summary.status === "NONE" || (summary.ci.length === 0 && summary.runtime.length === 0);

  if (isNotScanned) {
    return (
      <EmptyList
        icon={<ShieldCheck className="text-muted-foreground size-16" />}
        customText="Not scanned"
        description="Findings appear after the first CI scan or once the codebase runs in an environment."
      />
    );
  }

  return <FindingsView summary={summary} clusterName={clusterName} namespace={namespace} />;
}
