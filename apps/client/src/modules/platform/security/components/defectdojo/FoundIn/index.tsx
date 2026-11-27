import type { FindingPlace, StageRef } from "@my-project/shared";
import { Boxes, FolderGit2 } from "lucide-react";
import { CellLink } from "@/core/components/Table/components/CellLink";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { PATH_CDPIPELINE_STAGE_DETAILS_FULL } from "@/modules/platform/cdpipelines/pages/stage-details/route";
import { PATH_PROJECT_DETAILS_FULL } from "@/modules/platform/codebases/pages/details/route";
import { NO_VALUE } from "../constants";
import { environmentLabel, labelledLinkProps, placeLabel } from "../utils";

export interface FoundInProps {
  place: FindingPlace | null;
  /** The portal cluster and the installation namespace the links open in. */
  clusterName: string;
  namespace: string;
}

function joined(parts: (string | null)[], separator: string): string {
  return parts.filter((part): part is string => Boolean(part)).join(separator);
}

export interface CodebaseLinkProps {
  /** The portal cluster and the installation namespace the link opens in. */
  clusterName: string;
  namespace: string;
  codebase: string;
  /** The Environment the "Security Findings" tab opens on. */
  environment?: StageRef | null;
  iconOnly?: boolean;
}

/** Opens the "Security Findings" tab of the codebase. */
export function CodebaseLink({ clusterName, namespace, codebase, environment, iconOnly = false }: CodebaseLinkProps) {
  // Beside the codebase name the row names the Environment; the icon alone must name it.
  const label =
    iconOnly && environment
      ? `Security findings of ${codebase} in ${environmentLabel(environment)}`
      : `Security findings of ${codebase}`;

  return (
    <CellLink
      to={PATH_PROJECT_DETAILS_FULL}
      params={{ clusterName, namespace, name: codebase }}
      search={{ tab: "findings", ...(environment ?? {}) }}
      icon={FolderGit2}
      {...(iconOnly ? labelledLinkProps(label) : { text: codebase, "aria-label": label })}
    />
  );
}

export interface EnvironmentLinkProps {
  /** The portal cluster and the installation namespace the link opens in. */
  clusterName: string;
  namespace: string;
  environment: StageRef;
}

export function EnvironmentLink({ clusterName, namespace, environment }: EnvironmentLinkProps) {
  return (
    <CellLink
      to={PATH_CDPIPELINE_STAGE_DETAILS_FULL}
      params={{ clusterName, namespace, cdPipeline: environment.cdPipeline, stage: environment.stage }}
      text={environmentLabel(environment)}
      icon={Boxes}
      aria-label={`Environment ${environmentLabel(environment)}`}
    />
  );
}

export function FoundIn({ place, clusterName, namespace }: FoundInProps) {
  if (place === null) {
    return NO_VALUE;
  }

  if (place.level === "runtime") {
    const { environment, codebase } = place;
    return (
      <div className="flex min-w-0 flex-col gap-1">
        <TextWithTooltip text={placeLabel(place)} />
        <span className="text-muted-foreground text-xs break-all">
          {joined([joined([place.workload, place.container], " / "), place.version], " : ") || NO_VALUE}
        </span>
        {environment && <EnvironmentLink clusterName={clusterName} namespace={namespace} environment={environment} />}
        {codebase && (
          <CodebaseLink clusterName={clusterName} namespace={namespace} codebase={codebase} environment={environment} />
        )}
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <CodebaseLink clusterName={clusterName} namespace={namespace} codebase={place.codebase} />
      <span className="text-muted-foreground text-xs break-all">
        {joined([place.branch, joined([place.image, place.version], ":")], " · ") || NO_VALUE}
      </span>
    </div>
  );
}
