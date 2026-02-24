import { PageWrapper } from "@/core/components/PageWrapper";
import { FormGuideSidebar, FormGuideToggleButton } from "@/core/components/FormGuide";
import { FormGuideProvider } from "@/core/providers/FormGuide/provider";
import { routeProjectList } from "../list/route";
import { CreateCodebaseWizard } from "./components/CreateCodebaseWizard";
import { useWizardStore } from "./components/CreateCodebaseWizard/store";
import { HELP_CONFIG, WIZARD_GUIDE_STEPS } from "./components/CreateCodebaseWizard/constants";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";

export default function CreateCodebasePageContent() {
  const currentStepIdx = useWizardStore((s) => s.currentStepIdx);

  return (
    <FormGuideProvider
      config={HELP_CONFIG}
      steps={WIZARD_GUIDE_STEPS}
      currentStepIdx={currentStepIdx}
      docUrl={EDP_USER_GUIDE.APPLICATION_CREATE.url}
    >
      <PageWrapper
        breadcrumbs={[
          {
            label: "Projects",
            route: {
              to: routeProjectList.fullPath,
            },
          },
          {
            label: "Create New Project",
          },
        ]}
        breadcrumbsExtraContent={<FormGuideToggleButton />}
      >
        <div className="flex h-(--content-height) gap-4">
          <div className="min-h-0 flex-1">
            <CreateCodebaseWizard />
          </div>
          <FormGuideSidebar />
        </div>
      </PageWrapper>
    </FormGuideProvider>
  );
}
