import { PageWrapper } from "@/core/components/PageWrapper";
import { routeCDPipelineDetails } from "../../details/route";
import { CreateStageWizard } from "./components/CreateStageWizard";
import { routeStageCreate } from "./route";

export default function CreateStagePageContent() {
  const { namespace, cdPipeline } = routeStageCreate.useParams();

  return (
    <PageWrapper
      breadcrumbs={[
        {
          label: "Deployments",
          route: {
            to: routeCDPipelineDetails.fullPath,
          },
        },
        {
          label: cdPipeline,
          route: {
            to: routeCDPipelineDetails.fullPath,
            params: { namespace, name: cdPipeline },
          },
        },
        {
          label: "Create New Environment",
        },
      ]}
    >
      <div className="h-(--content-height)">
        <CreateStageWizard />
      </div>
    </PageWrapper>
  );
}
