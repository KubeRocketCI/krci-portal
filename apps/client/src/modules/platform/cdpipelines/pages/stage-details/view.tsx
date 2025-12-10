import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { PageWrapper } from "@/core/components/PageWrapper";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { PATH_CDPIPELINE_DETAILS_FULL } from "../details/route";
import { PATH_CDPIPELINES_FULL } from "../list/route";
import { Content } from "./components/Content";
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
      headerSlot={<LearnMoreLink url={EDP_USER_GUIDE.CD_PIPELINE_MANAGE.url} />}
    >
      <Content />
    </PageWrapper>
  );
}
