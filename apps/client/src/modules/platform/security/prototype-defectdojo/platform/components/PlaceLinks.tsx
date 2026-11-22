// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
import { Link } from "@tanstack/react-router";
import { PATH_CDPIPELINE_STAGE_DETAILS_FULL } from "@/modules/platform/cdpipelines/pages/stage-details/route";
import { PATH_PROJECT_DETAILS_FULL } from "@/modules/platform/codebases/pages/details/route";
import type { PlatformScope, PlatformStage } from "../types";

const LINK_CLASS =
  "text-secondary-dark hover:text-primary focus-visible:ring-ring rounded text-xs underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none";

/** Link to the Security Findings tab of a codebase. */
export function CodebaseFindingsLink({ scope, codebaseName }: { scope: PlatformScope; codebaseName: string }) {
  return (
    <Link
      to={PATH_PROJECT_DETAILS_FULL}
      params={{ clusterName: scope.portalClusterName, namespace: scope.installationNamespace, name: codebaseName }}
      search={{ tab: "findings" }}
      title={`Security findings of codebase ${codebaseName}`}
      className={LINK_CLASS}
    >
      {codebaseName}
    </Link>
  );
}

/** Link to the Overview tab of an Environment, which holds its Runtime security summary. */
export function EnvironmentFindingsLink({ scope, stage }: { scope: PlatformScope; stage: PlatformStage }) {
  return (
    <Link
      to={PATH_CDPIPELINE_STAGE_DETAILS_FULL}
      params={{
        clusterName: scope.portalClusterName,
        namespace: scope.installationNamespace,
        cdPipeline: stage.cdPipeline,
        stage: stage.stage,
      }}
      search={{ tab: "overview" }}
      title={`Environment ${stage.cdPipeline} / ${stage.stage}`}
      className={LINK_CLASS}
    >
      {stage.cdPipeline} / {stage.stage}
    </Link>
  );
}
