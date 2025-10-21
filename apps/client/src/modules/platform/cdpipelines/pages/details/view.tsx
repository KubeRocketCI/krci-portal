import { PageWrapper } from "@/core/components/PageWrapper";
import { PATH_CDPIPELINES_FULL } from "../list/route";
import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { HeaderActions } from "./components/HeaderActions";
import { StageList } from "./components/StageList";
import { StageListFilter } from "./components/StageListFilter";
import { routeCDPipelineDetails } from "./route";
import { Section } from "@/core/components/Section";
import { Box, Stack } from "@mui/material";

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
        <Stack spacing={3} flexGrow={1} display="flex">
          <Box>
            <StageListFilter />
          </Box>
          <Box flexGrow={1} display="flex" flexDirection="column">
            <StageList />
          </Box>
        </Stack>
      </Section>
    </PageWrapper>
  );
}
