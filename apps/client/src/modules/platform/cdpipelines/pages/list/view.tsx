import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { EmptyList } from "@/core/components/EmptyList";
import { PageGuideButton } from "@/core/components/PageGuide";
import { PageWrapper } from "@/core/components/PageWrapper";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { useCDPipelinePermissions } from "@/k8s/api/groups/KRCI/CDPipeline";
import { useCodebaseWatchList } from "@/k8s/api/groups/KRCI/Codebase";
import { routeGitopsConfiguration } from "@/modules/platform/configuration/modules/gitops/route";
import { codebaseLabels, codebaseType } from "@my-project/shared";
import { CloudUpload, Plus } from "lucide-react";
import { CDPipelineList } from "./components/CDPipelineList";
import { Link } from "@tanstack/react-router";
import { routeCDPipelineCreate } from "../create/route";
import { routeCDPipelineList } from "./route";
import React from "react";

export default function CDPipelineListPage() {
  const cdPipelinePermissions = useCDPipelinePermissions();
  const { clusterName } = routeCDPipelineList.useParams();

  const gitOpsCodebaseWatch = useCodebaseWatchList({
    labels: {
      [codebaseLabels.codebaseType]: codebaseType.system,
    },
  });

  const gitOpsCodebase = gitOpsCodebaseWatch.data.array?.[0];

  const renderBlockerIfNoGitOpsCodebase = React.useMemo(() => {
    if (gitOpsCodebaseWatch.query.isFetched && !gitOpsCodebase) {
      return (
        <EmptyList
          customText={"No GitOps repository configured."}
          linkText={"Click here to add a repository."}
          route={{
            to: routeGitopsConfiguration.fullPath,
          }}
        />
      );
    }
  }, [gitOpsCodebaseWatch.query.isFetched, gitOpsCodebase]);
  const isCreateDeploymentAllowed = cdPipelinePermissions.data.create.allowed && Boolean(gitOpsCodebase);
  const createDeploymentReason = !cdPipelinePermissions.data.create.allowed
    ? cdPipelinePermissions.data.create.reason
    : "No GitOps repository configured. Configure GitOps first.";

  const deploymentButtonContent = (
    <>
      <Plus />
      Create Deployment
    </>
  );

  return (
    <PageWrapper
      breadcrumbs={[{ label: "Deployments" }]}
      headerSlot={
        <>
          <PageGuideButton tourId="deploymentsListTour" />
        </>
      }
    >
      <PageContentWrapper
        icon={CloudUpload}
        title="Deployments"
        description="Orchestrate and Monitor Your Deployments."
        actions={
          <div data-tour="create-deployment-button">
            <ButtonWithPermission
              ButtonProps={{
                variant: "default",
                asChild: isCreateDeploymentAllowed,
              }}
              allowed={isCreateDeploymentAllowed}
              reason={createDeploymentReason}
            >
              {isCreateDeploymentAllowed ? (
                <Link to={routeCDPipelineCreate.fullPath} params={{ clusterName }} className="no-underline">
                  {deploymentButtonContent}
                </Link>
              ) : (
                deploymentButtonContent
              )}
            </ButtonWithPermission>
          </div>
        }
      >
        <CDPipelineList blockerComponent={renderBlockerIfNoGitOpsCodebase} />
      </PageContentWrapper>
    </PageWrapper>
  );
}
