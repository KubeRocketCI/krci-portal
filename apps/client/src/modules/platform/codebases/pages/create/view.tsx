import { PageWrapper } from "@/core/components/PageWrapper";
import { routeProjectList } from "../list/route";
import { CreateCodebaseWizard } from "./components/CreateCodebaseWizard";

export default function CreateCodebasePageContent() {
  return (
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
    >
      <div className="h-(--content-height)">
        <CreateCodebaseWizard />
      </div>
    </PageWrapper>
  );
}
