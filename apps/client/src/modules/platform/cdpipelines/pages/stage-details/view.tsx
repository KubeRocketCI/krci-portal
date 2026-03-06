import { PageGuideButton } from "@/core/components/PageGuide";
import { PageWrapper } from "@/core/components/PageWrapper";
import { PATH_CDPIPELINE_DETAILS_FULL } from "../details/route";
import { PATH_CDPIPELINES_FULL } from "../list/route";
import { Content } from "./components/Content";
import { routeStageDetails } from "./route";

export default function StageDetailsPageContent() {
  const params = routeStageDetails.useParams();

  return (
    <PageWrapper
      breadcrumbs={[
        { label: "Deployments", route: { to: PATH_CDPIPELINES_FULL } },
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
          label: "Environments",
        },
        {
          label: params.stage,
        },
      ]}
      headerSlot={
        <>
          <PageGuideButton tourId="stageDetailsTour" />
        </>
      }
    >
      <Content />
    </PageWrapper>
  );
}
