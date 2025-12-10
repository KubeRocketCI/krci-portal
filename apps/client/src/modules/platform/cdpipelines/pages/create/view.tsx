import { PageWrapper } from "@/core/components/PageWrapper";
import { routeCDPipelineList } from "../list/route";
import { CreateCDPipelineWizard } from "./components/CreateCDPipelineWizard";

export default function CreateCDPipelinePageContent() {
  return (
    <PageWrapper
      breadcrumbs={[
        {
          label: "Deployment Flows",
          route: {
            to: routeCDPipelineList.fullPath,
          },
        },
        {
          label: "Create New Deployment Flow",
        },
      ]}
    >
      <div className="h-(--content-height)">
        <CreateCDPipelineWizard />
      </div>
    </PageWrapper>
  );
}
