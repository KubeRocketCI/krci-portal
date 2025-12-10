import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { useStagePermissions } from "@/k8s/api/groups/KRCI/Stage";
import { Layers } from "lucide-react";
import { routeStageCreate } from "../../../stages/create/route";
import { routeCDPipelineDetails } from "../../route";
import { Link } from "@tanstack/react-router";

export const CreateEnvironmentButton = () => {
  const stagePermissions = useStagePermissions();
  const { clusterName, namespace, name } = routeCDPipelineDetails.useParams();

  return (
    <ButtonWithPermission
      ButtonProps={{
        variant: "default",
        asChild: true,
      }}
      allowed={stagePermissions.data.create.allowed}
      reason={stagePermissions.data.create.reason}
    >
      <Link
        to={routeStageCreate.fullPath}
        params={{ clusterName, namespace, cdPipeline: name }}
        className="no-underline"
      >
        <Layers />
        Create Environment
      </Link>
    </ButtonWithPermission>
  );
};
