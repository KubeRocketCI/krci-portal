import { ComponentList } from "./components/ComponentList";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { PageWrapper } from "@/core/components/PageWrapper";
import { Section } from "@/core/components/Section";
import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { useCodebasePermissions } from "@/k8s/api/groups/KRCI/Codebase";
import { useGitServerWatchList } from "@/k8s/api/groups/KRCI/GitServer";
import { Box, Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { routeCodebaseCreate } from "../create/route";
import { routeComponentList } from "./route";

export default function ComponentListPageContent() {
  const { clusterName } = routeComponentList.useParams();

  const codebasePermissions = useCodebasePermissions();

  const gitServerListWatch = useGitServerWatchList();

  const noGitServers = gitServerListWatch.isEmpty;
  return (
    <PageWrapper
      breadcrumbs={[{ label: "Components" }]}
      headerSlot={<LearnMoreLink url={EDP_USER_GUIDE.APPLICATION_CREATE.url} />}
    >
      <Section
        icon={Box}
        title="Components"
        description="Create, view, and manage diverse codebases, encompassing applications, libraries, autotests, and Terraform infrastructure code."
        actions={
          <ButtonWithPermission
            ButtonProps={{
              variant: "default",
              disabled: noGitServers,
              asChild: true,
            }}
            allowed={codebasePermissions.data.create.allowed}
            reason={codebasePermissions.data.create.reason}
          >
            <Link to={routeCodebaseCreate.fullPath} params={{ clusterName: clusterName }} className="no-underline">
              <Plus />
              Create Component
            </Link>
          </ButtonWithPermission>
        }
      >
        <ComponentList />
      </Section>
    </PageWrapper>
  );
}
