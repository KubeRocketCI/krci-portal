// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
import type { Codebase } from "@my-project/shared";
import { ApplicationSecurityCell } from "@/modules/platform/cdpipelines/prototype-defectdojo/components/ApplicationSecurityCell";
import { useStageEnvironmentScope } from "@/modules/platform/cdpipelines/prototype-defectdojo/hooks/useStageEnvironmentScope";
import { routeStageDetails } from "@/modules/platform/cdpipelines/pages/stage-details/route";

/** "Security" column of the Applications table: Runtime findings of the application in this Environment, from DefectDojo. */
export const PrototypeSecurityColumn = ({ appCodebase }: { appCodebase: Codebase }) => {
  const params = routeStageDetails.useParams();
  const { pipeline } = useStageEnvironmentScope();

  if (!pipeline) {
    return null;
  }

  return <ApplicationSecurityCell pipeline={pipeline} stage={params.stage} codebaseName={appCodebase.metadata.name} />;
};
