import { PageWrapper } from "@/core/components/PageWrapper";
import { PATH_CDPIPELINES_FULL } from "../list/route";
import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { HeaderActions } from "./components/HeaderActions";
import { StageList } from "./components/StageList";
import { StageListFilter } from "./components/StageListFilter";
import { routeCDPipelineDetails } from "./route";
import { Section } from "@/core/components/Section";

export default function CDPipelineDetailsPageContent() {
  const { name, clusterName } = routeCDPipelineDetails.useParams();

  return (
    <PageWrapper
      breadcrumbs={[
        {
          label: "Deployment Flows",
          route: {
            to: PATH_CDPIPELINES_FULL,
            params: {
              clusterName,
            },
          },
        },
        {
          label: name,
        },
      ]}
      headerSlot={<HeaderActions />}
    >
      <Section
        title={name}
        enableCopyTitle
        description={
          <>
            Defines the sequence and logic for promoting artifacts through various environments. It maps out an
            artifact's progression path from development to production.{" "}
            <LearnMoreLink url={EDP_USER_GUIDE.CD_PIPELINE_MANAGE.url} />
          </>
        }
      >
        <div className="flex flex-col gap-6 grow">
          <div>
            <StageListFilter />
          </div>
          <div className="flex-1 flex flex-col">
            <StageList />
          </div>
        </div>
      </Section>
    </PageWrapper>
  );
}
