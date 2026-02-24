import { PageWrapper } from "@/core/components/PageWrapper";
import { FormGuideSidebar, FormGuideToggleButton } from "@/core/components/FormGuide";
import { FormGuideProvider } from "@/core/providers/FormGuide/provider";
import { routeCDPipelineDetails } from "../../details/route";
import { CreateStageWizard } from "./components/CreateStageWizard";
import { useWizardStore } from "./components/CreateStageWizard/store";
import { HELP_CONFIG, WIZARD_GUIDE_STEPS } from "./components/CreateStageWizard/names";
import { routeStageCreate } from "./route";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";

export default function CreateStagePageContent() {
  const { namespace, cdPipeline } = routeStageCreate.useParams();
  const currentStepIdx = useWizardStore((s) => s.currentStepIdx);

  return (
    <FormGuideProvider
      config={HELP_CONFIG}
      steps={WIZARD_GUIDE_STEPS}
      currentStepIdx={currentStepIdx}
      docUrl={EDP_USER_GUIDE.CD_PIPELINE_MANAGE.anchors.ADD_STAGE.url}
    >
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
        breadcrumbsExtraContent={<FormGuideToggleButton />}
      >
        <div className="flex h-(--content-height) gap-4">
          <div className="min-h-0 flex-1">
            <CreateStageWizard />
          </div>
          <FormGuideSidebar />
        </div>
      </PageWrapper>
    </FormGuideProvider>
  );
}
