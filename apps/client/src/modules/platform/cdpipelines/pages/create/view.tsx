import { PageWrapper } from "@/core/components/PageWrapper";
import { FormGuideSidebar, FormGuideToggleButton } from "@/core/components/FormGuide";
import { FormGuideProvider } from "@/core/providers/FormGuide/provider";
import { routeCDPipelineList } from "../list/route";
import { CreateCDPipelineWizard } from "./components/CreateCDPipelineWizard";
import { useWizardStore } from "./components/CreateCDPipelineWizard/store";
import { HELP_CONFIG, WIZARD_GUIDE_STEPS } from "./components/CreateCDPipelineWizard/constants";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";

export default function CreateCDPipelinePageContent() {
  const currentStepIdx = useWizardStore((s) => s.currentStepIdx);

  return (
    <FormGuideProvider
      config={HELP_CONFIG}
      steps={WIZARD_GUIDE_STEPS}
      currentStepIdx={currentStepIdx}
      docUrl={EDP_USER_GUIDE.CD_PIPELINE_CREATE.url}
    >
      <PageWrapper
        breadcrumbs={[
          {
            label: "Deployments",
            route: {
              to: routeCDPipelineList.fullPath,
            },
          },
          {
            label: "Create New Deployment",
          },
        ]}
        breadcrumbsExtraContent={<FormGuideToggleButton />}
      >
        <div className="flex h-(--content-height) gap-4">
          <div className="min-h-0 flex-1">
            <CreateCDPipelineWizard />
          </div>
          <FormGuideSidebar />
        </div>
      </PageWrapper>
    </FormGuideProvider>
  );
}
