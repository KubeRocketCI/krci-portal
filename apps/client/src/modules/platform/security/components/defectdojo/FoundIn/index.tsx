import type { FindingPlace } from "@my-project/shared";
import { Boxes, FolderGit2 } from "lucide-react";
import { CellLink } from "@/core/components/Table/components/CellLink";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { PATH_CDPIPELINE_STAGE_DETAILS_FULL } from "@/modules/platform/cdpipelines/pages/stage-details/route";
import { PATH_PROJECT_DETAILS_FULL } from "@/modules/platform/codebases/pages/details/route";
import { NO_VALUE } from "../constants";
import { environmentLabel } from "../utils";

export interface FoundInProps {
  place: FindingPlace | null;
  /** The portal cluster and the installation namespace the links open in. */
  clusterName: string;
  namespace: string;
}

function joined(parts: (string | null)[], separator: string): string {
  return parts.filter((part): part is string => Boolean(part)).join(separator);
}

interface CodebaseLinkProps {
  clusterName: string;
  namespace: string;
  codebase: string;
  /** The Environment the "Security Findings" tab opens on. */
  environment?: { cdPipeline: string; stage: string } | null;
}

function CodebaseLink({ clusterName, namespace, codebase, environment }: CodebaseLinkProps) {
  return (
    <CellLink
      to={PATH_PROJECT_DETAILS_FULL}
      params={{ clusterName, namespace, name: codebase }}
      search={{ tab: "findings", ...(environment ?? {}) }}
      text={codebase}
      icon={FolderGit2}
      aria-label={`Security findings of ${codebase}`}
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
        <TextWithTooltip text={`${place.cluster} / ${place.namespace}`} />
        <span className="text-muted-foreground text-xs break-all">
          {joined([joined([place.workload, place.container], " / "), place.version], " : ") || NO_VALUE}
        </span>
        {environment && (
          <CellLink
            to={PATH_CDPIPELINE_STAGE_DETAILS_FULL}
            params={{ clusterName, namespace, cdPipeline: environment.cdPipeline, stage: environment.stage }}
            text={environmentLabel(environment)}
            icon={Boxes}
            aria-label={`Environment ${environmentLabel(environment)}`}
          />
        )}
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
