import { PageWrapper } from "@/core/components/PageWrapper";
import { PATH_CDPIPELINE_DETAILS_FULL } from "../details/route";
import { PATH_CDPIPELINES_FULL } from "../list/route";
import { Content } from "./components/Content";
import { HeaderActions } from "./components/HeaderActions";
import { routeStageDetails } from "./route";

export default function StageDetailsPageContent() {
  const params = routeStageDetails.useParams();

  return (
    <PageWrapper
      breadcrumbs={[
        { label: "Deployment Flows", route: { to: PATH_CDPIPELINES_FULL } },
        {
          label: params.cdPipeline,
          route: {
            to: PATH_CDPIPELINE_DETAILS_FULL,
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
