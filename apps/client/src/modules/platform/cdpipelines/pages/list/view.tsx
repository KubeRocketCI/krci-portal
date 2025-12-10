import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { EmptyList } from "@/core/components/EmptyList";
import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { PageWrapper } from "@/core/components/PageWrapper";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { Section } from "@/core/components/Section";
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

  return (
    <PageWrapper
      breadcrumbs={[{ label: "Deployment Flows" }]}
      headerSlot={<LearnMoreLink url={EDP_USER_GUIDE.CD_PIPELINE_CREATE.anchors.CREATE_VIA_UI.url} />}
    >
      <Section
        icon={CloudUpload}
        title="Deployment Flows"
        description="Orchestrate and Monitor Your Deployment Flows."
        actions={
          <ButtonWithPermission
            ButtonProps={{
              variant: "default",
              disabled: !gitOpsCodebase,
              asChild: true,
            }}
            allowed={cdPipelinePermissions.data.create.allowed}
            reason={cdPipelinePermissions.data.create.reason}
          >
            <Link to={routeCDPipelineCreate.fullPath} params={{ clusterName }} className="no-underline">
              <Plus />
              Create Deployment Flow
            </Link>
          </ButtonWithPermission>
        }
      >
        <CDPipelineList blockerComponent={renderBlockerIfNoGitOpsCodebase} />
      </Section>
    </PageWrapper>
  );
}
