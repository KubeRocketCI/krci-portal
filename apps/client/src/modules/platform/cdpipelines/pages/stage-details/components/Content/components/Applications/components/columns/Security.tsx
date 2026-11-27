import {
  hasActiveEnvironmentFindings,
  hasActiveFindings,
  isRunningEnvironmentContainer,
  type EnvironmentApplication,
  type EnvironmentSummaryInput,
  type RunningEnvironmentContainer,
} from "@my-project/shared";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import { plural } from "@/core/utils/format/plural";
import { useEnvironmentSummary } from "@/modules/platform/cdpipelines/pages/stage-details/hooks/useEnvironmentSummary";
import { DEFECTDOJO_STATE_TEXT, NO_VALUE } from "@/modules/platform/security/components/defectdojo/constants";
import { CodebaseLink } from "@/modules/platform/security/components/defectdojo/FoundIn";
import { SeverityCountsRow } from "@/modules/platform/security/components/defectdojo/SeverityCountsRow";
import { RetryIconButton } from "@/modules/platform/security/components/defectdojo/StateBlocks";

export interface SecurityColumnProps {
  environment: EnvironmentSummaryInput;
  /** The portal cluster the link opens in. */
  clusterName: string;
  codebase: string;
}

function Dash({ reason }: { reason: string }) {
  return (
    <div className="text-muted-foreground flex min-w-0 items-center gap-1">
      <span className="text-xs" aria-hidden>
        {NO_VALUE}
      </span>
      <TextWithTooltip text={reason} className="min-w-0 text-xs" maxLineAmount={2} />
    </div>
  );
}

function Failed({ reason, onRetry, isRetrying }: { reason: string; onRetry: () => void; isRetrying: boolean }) {
  return (
    <div className="text-destructive flex min-w-0 items-center gap-1">
      <TextWithTooltip text={reason} className="min-w-0 text-xs" maxLineAmount={2} />
      <RetryIconButton onRetry={onRetry} isRetrying={isRetrying} />
    </div>
  );
}

function ContainerLine({ container, named }: { container: RunningEnvironmentContainer; named: boolean }) {
  const { vulnerabilities } = container;
  const secrets = container.secrets ?? 0;

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
      {named && <TextWithTooltip text={container.container} className="text-muted-foreground max-w-40 text-xs" />}
      {vulnerabilities !== null && hasActiveFindings(vulnerabilities) && (
        <SeverityCountsRow counts={vulnerabilities} label={`Vulnerabilities of ${container.container}`} activeOnly />
      )}
      {vulnerabilities === null && (
        <TextWithTooltip text="No vulnerability report" className="text-muted-foreground text-xs" />
      )}
      {secrets > 0 && (
        <TextWithTooltip text={plural(secrets, "secret")} className="text-destructive text-xs font-medium" />
      )}
      {vulnerabilities !== null && !hasActiveEnvironmentFindings(container) && (
        <TextWithTooltip text={DEFECTDOJO_STATE_TEXT.clean} className="text-muted-foreground text-xs" />
      )}
    </div>
  );
}

function ApplicationFindings({ application }: { application: EnvironmentApplication }) {
  if (application.state !== "data") {
    return <Dash reason={DEFECTDOJO_STATE_TEXT[application.state]} />;
  }

  // A closed test stays in DefectDojo: the containers that no longer run get no line beside running ones.
  const running = application.containers.filter(isRunningEnvironmentContainer);
  return (
    <div className="flex min-w-0 flex-col gap-1">
      {running.map((container) => (
        <ContainerLine
          key={`${container.workload}/${container.container}`}
          container={container}
          named={running.length > 1}
        />
      ))}
    </div>
  );
}

function EnvironmentFindings({ environment, codebase }: Omit<SecurityColumnProps, "clusterName">) {
  const query = useEnvironmentSummary(environment);
  const summary = query.data;
  const retry = { onRetry: () => void query.refetch(), isRetrying: query.isFetching };

  if (summary === undefined) {
    return query.isError ? (
      <Failed reason={DEFECTDOJO_STATE_TEXT.loadFailed} {...retry} />
    ) : (
      <LoadingSpinner size={16} />
    );
  }
  if (summary.state === "notConfigured") {
    return <Dash reason={DEFECTDOJO_STATE_TEXT.notConfigured} />;
  }
  if (summary.state === "unreachable") {
    return <Failed reason={DEFECTDOJO_STATE_TEXT.unreachable} {...retry} />;
  }
  if (summary.state === "noScanData") {
    return <Dash reason={DEFECTDOJO_STATE_TEXT.noScanData} />;
  }
  if (summary.applications === null) {
    return <Dash reason="Applications cannot be read" />;
  }

  const application = summary.applications.find((entry) => entry.codebase === codebase);
  return application ? (
    <ApplicationFindings application={application} />
  ) : (
    <Dash reason={DEFECTDOJO_STATE_TEXT.noScanData} />
  );
}

export function SecurityColumn({ environment, clusterName, codebase }: SecurityColumnProps) {
  return (
    <div className="flex min-w-0 items-start gap-2">
      <EnvironmentFindings environment={environment} codebase={codebase} />
      <CodebaseLink
        clusterName={clusterName}
        namespace={environment.namespace}
        codebase={codebase}
        environment={{ cdPipeline: environment.cdPipeline, stage: environment.stage }}
        iconOnly
      />
    </div>
  );
}
