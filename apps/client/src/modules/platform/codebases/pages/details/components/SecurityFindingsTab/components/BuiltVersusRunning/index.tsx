import React from "react";
import { CircleDashed } from "lucide-react";
import {
  runtimeContainerKey,
  runtimeContainerRef,
  type CodebaseFindingsInput,
  type CodebaseScan,
  type RuntimeLevel,
} from "@my-project/shared";
import { Badge } from "@/core/components/ui/badge";
import { Card } from "@/core/components/ui/card";
import { cn } from "@/core/utils/classname";
import { NO_VALUE } from "@/modules/platform/security/components/defectdojo/constants";
import { DefectDojoLink } from "@/modules/platform/security/components/defectdojo/DefectDojoLink";
import { SeverityCountsRow } from "@/modules/platform/security/components/defectdojo/SeverityCountsRow";
import { formatScanTime } from "@/modules/platform/security/components/defectdojo/utils";
import { NO_ENVIRONMENT_HINT } from "../../constants";
import { focusedProps } from "../../focusedProps";
import type { SecurityFindingsFocus } from "../../types";
import { containerLabel, containerTestUrl, environmentLabel } from "../../utils";
import { SecretsBadge } from "../SecretsBadge";
import { ComponentGroups } from "./ComponentGroups";
import { pairBuiltWithRunning, type RunningCounterpart } from "./utils";

export interface BuiltVersusRunningProps {
  codebase: CodebaseFindingsInput;
  /** The scan of the codebase's own image: the built side. */
  scan: CodebaseScan;
  /** The containers that run in the Environments: the running side. */
  runtime: RuntimeLevel;
  /** Its running cards come first. */
  focus: SecurityFindingsFocus | null;
  /** What the scan is: scanner and image. */
  title: string;
}

interface TagMarkProps {
  sameTag: boolean | null;
  builtTag: string;
  runningTag: string;
}

function TagMark({ sameTag, builtTag, runningTag }: TagMarkProps) {
  if (sameTag === null) {
    return null;
  }

  return sameTag ? (
    <Badge variant="success">Same image tag</Badge>
  ) : (
    <span className="flex flex-wrap items-center gap-2">
      <Badge variant="warning">Different image tags</Badge>
      <span className="text-muted-foreground text-xs break-all">
        Built {builtTag}, running {runningTag}
      </span>
    </span>
  );
}

function BuiltCard({ codebase, scan, title }: Pick<BuiltVersusRunningProps, "codebase" | "scan" | "title">) {
  const headingId = React.useId();

  return (
    <Card className="space-y-3 p-4" role="group" aria-labelledby={headingId}>
      <div className="space-y-0.5">
        <h4 id={headingId} className="text-foreground text-sm font-semibold">
          Built image
        </h4>
        <p className="text-muted-foreground text-xs break-all">{scan.ref.image}</p>
        <p className="text-xs">
          {scan.ref.scanner}, branch {scan.ref.branch}
        </p>
        <p className="text-xs">
          <span className="text-muted-foreground">Image tag </span>
          <span className="break-all">{scan.version || NO_VALUE}</span>
        </p>
      </div>
      <SeverityCountsRow counts={scan.counts} label={`Counts of ${title}`} />
      <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <span>{scan.triaged} triaged</span>
        <span>Last upload {formatScanTime(scan.date)}</span>
        <DefectDojoLink href={scan.testUrl} label={`Test of ${title}`} />
      </div>
      <ComponentGroups codebase={codebase} scan={scan.ref} label={`Built image, ${title}`} />
    </Card>
  );
}

interface RunningCardProps {
  codebase: CodebaseFindingsInput;
  counterpart: RunningCounterpart;
  builtTag: string;
}

function RunningCard({ codebase, counterpart, builtTag }: RunningCardProps) {
  const headingId = React.useId();
  const { environment, container, sameTag, focused } = counterpart;
  const label = environmentLabel(environment);
  const { vulnerabilities, secrets } = container;
  const testUrl = containerTestUrl(container);
  const focus = focusedProps(focused);

  return (
    <Card {...focus} className={cn("space-y-3 p-4", focus.className)} role="group" aria-labelledby={headingId}>
      <div className="space-y-0.5">
        <h4 id={headingId} className="text-foreground text-sm font-semibold">
          Running in {label}
        </h4>
        <p className="text-muted-foreground text-xs break-all">
          {environment.clusterName} / {environment.namespace}
        </p>
        <p className="text-xs break-all">
          {container.workload} / {container.container}
        </p>
        <p className="flex flex-wrap items-center gap-2 text-xs">
          <span>
            <span className="text-muted-foreground">Image tag </span>
            <span className="break-all">{container.version || NO_VALUE}</span>
          </span>
          <TagMark sameTag={sameTag} builtTag={builtTag} runningTag={container.version} />
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <SeverityCountsRow
          counts={vulnerabilities?.counts ?? null}
          label={`Counts of ${containerLabel(environment, container)}`}
          missing="no vulnerability report"
        />
        <SecretsBadge active={secrets?.active ?? null} />
      </div>
      <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        {vulnerabilities && <span>{vulnerabilities.triaged} triaged</span>}
        <span>Last upload {formatScanTime(container.date)}</span>
        {testUrl && <DefectDojoLink href={testUrl} label={`Test of ${containerLabel(environment, container)}`} />}
      </div>
      {vulnerabilities && (
        <ComponentGroups
          codebase={codebase}
          scan={runtimeContainerRef(environment, container, "vulnerabilityreport")}
          label={`Running in ${label}`}
        />
      )}
    </Card>
  );
}

/**
 * The counts of the two sides are never added: the scanners of the CI scan and of the runtime operator are configured
 * differently.
 */
export function BuiltVersusRunning({ codebase, scan, runtime, focus, title }: BuiltVersusRunningProps) {
  const counterparts = pairBuiltWithRunning(scan, runtime, focus);

  return (
    <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
      <BuiltCard codebase={codebase} scan={scan} title={title} />
      <div className="flex min-w-0 flex-col gap-3">
        {counterparts.length === 0 ? (
          <div className="text-muted-foreground flex items-start gap-2 rounded-lg border border-dashed p-4 text-sm">
            <CircleDashed className="mt-0.5 size-4 shrink-0" aria-hidden />
            {runtime.environments.length === 0 ? NO_ENVIRONMENT_HINT : "No Environment runs this image."}
          </div>
        ) : (
          counterparts.map((counterpart) => (
            <RunningCard
              key={runtimeContainerKey(counterpart.environment, counterpart.container)}
              codebase={codebase}
              counterpart={counterpart}
              builtTag={scan.version}
            />
          ))
        )}
      </div>
    </div>
  );
}
