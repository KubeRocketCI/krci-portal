import type { CodebaseFindingsInput } from "@my-project/shared";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import {
  LoadFailedState,
  NotConfiguredState,
  UnreachableState,
} from "@/modules/platform/security/components/defectdojo/StateBlocks";
import { CoverageMatrix } from "./components/CoverageMatrix";
import { useCodebaseFindings } from "./hooks/useCodebaseFindings";
import type { SecurityFindingsFocus } from "./types";

export interface SecurityFindingsTabProps {
  codebaseName: string;
  namespace: string;
  /** The Environment the page was opened for, from the route search. `null`: none. */
  focus: SecurityFindingsFocus | null;
}

/**
 * Tab "Security Findings" of the codebase page: the Code and Image scans of the codebase and the containers that run
 * in its Environments, from DefectDojo. The rest of the page works in every state of DefectDojo.
 */
export function SecurityFindingsTab({ codebaseName, namespace, focus }: SecurityFindingsTabProps) {
  const codebase: CodebaseFindingsInput = { namespace, name: codebaseName };
  const query = useCodebaseFindings(codebase);
  const findings = query.data;

  if (findings === undefined) {
    return query.isError ? (
      <LoadFailedState
        message={query.error.message}
        onRetry={() => void query.refetch()}
        isRetrying={query.isFetching}
      />
    ) : (
      <div className="flex items-center justify-center p-12">
        <LoadingSpinner />
      </div>
    );
  }

  switch (findings.state) {
    case "notConfigured":
      return <NotConfiguredState />;
    case "unreachable":
      return <UnreachableState onRetry={() => void query.refetch()} isRetrying={query.isFetching} />;
    case "data":
      return <CoverageMatrix levels={findings.levels} codebase={codebase} focus={focus} />;
  }
}
