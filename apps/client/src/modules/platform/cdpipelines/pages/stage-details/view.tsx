import { PageWrapper } from "@/core/components/PageWrapper";
import { routeCDPipelineDetails } from "../details/route";
import { routeCDPipelineList } from "../list/route";
import { Content } from "./components/Content";
import { HeaderActions } from "./components/HeaderActions";
import { routeStageDetails } from "./route";

export default function StageDetailsPageContent() {
  const params = routeStageDetails.useParams();

  return (
    <PageWrapper
      breadcrumbs={[
        { label: "Deployment Flows", route: { to: routeCDPipelineList.to } },
        {
          label: params.cdPipeline,
          route: {
            to: routeCDPipelineDetails.to,
            params: {
              name: params.cdPipeline,
              namespace: params.namespace,
            },
          },
        },
        {
          label: params.stage,
        },
      ]}
      headerSlot={<HeaderActions />}
    >
      <Content />
    </PageWrapper>
  );
}
