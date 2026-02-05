import { PageWrapper } from "@/core/components/PageWrapper";
import { routeComponentList } from "../list/route";
import { CreateCodebaseWizard } from "./components/CreateCodebaseWizard";

export default function CreateCodebasePageContent() {
  return (
    <PageWrapper
      breadcrumbs={[
        {
          label: "Projects",
          route: {
            to: routeComponentList.fullPath,
          },
        },
        {
          label: "Create New Project",
        },
      ]}
    >
      <div className="h-(--content-height)">
        <CreateCodebaseWizard />
      </div>
    </PageWrapper>
  );
}
