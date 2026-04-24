import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { PageWrapper } from "@/core/components/PageWrapper";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { Bot } from "lucide-react";
import { Pipelines } from "./components/Pipelines";
import { Card } from "@/core/components/ui/card";

export default function PipelineRunListView() {
  return (
    <PageWrapper
      breadcrumbs={[{ label: "PipelineRuns" }]}
      headerSlot={<LearnMoreLink url={EDP_USER_GUIDE.PIPELINES.url} />}
    >
      <PageContentWrapper
        icon={Bot}
        title="PipelineRuns"
        description="Monitor the progress of overall pipeline runs launched within the platform."
      >
        <Card className="px-6 pb-6">
          <Pipelines />
        </Card>
      </PageContentWrapper>
    </PageWrapper>
  );
}
