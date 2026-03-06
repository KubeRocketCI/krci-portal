import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { useStagePermissions } from "@/k8s/api/groups/KRCI/Stage";
import { Plus } from "lucide-react";
import { routeStageCreate } from "../../../stages/create/route";
import { routeCDPipelineDetails } from "../../route";
import { Link } from "@tanstack/react-router";

export const CreateEnvironmentButton = () => {
  const stagePermissions = useStagePermissions();
  const { clusterName, namespace, name } = routeCDPipelineDetails.useParams();

  return (
    <div data-tour="create-environment-button">
      <ButtonWithPermission
        ButtonProps={{
          variant: "default",
          size: "sm",
          asChild: true,
        }}
        allowed={stagePermissions.data.create.allowed}
        reason={stagePermissions.data.create.reason}
      >
        <Link
          to={routeStageCreate.fullPath}
          params={{ clusterName, namespace, cdPipeline: name }}
          className="flex items-center gap-1.5 no-underline"
        >
          <Plus size={12} /> Create Environment
        </Link>
      </ButtonWithPermission>
    </div>
  );
};
