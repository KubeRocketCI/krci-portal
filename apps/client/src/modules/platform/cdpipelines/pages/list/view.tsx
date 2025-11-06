import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { EmptyList } from "@/core/components/EmptyList";
import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { PageWrapper } from "@/core/components/PageWrapper";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { ManageCDPipelineDialog } from "../../dialogs/ManageCDPipeline";
import { Section } from "@/core/components/Section";
import { useCDPipelinePermissions } from "@/k8s/api/groups/KRCI/CDPipeline";
import { useCodebaseWatchList } from "@/k8s/api/groups/KRCI/Codebase";
import { useDialogContext } from "@/core/providers/Dialog/hooks";
import { routeGitopsConfiguration } from "@/modules/platform/configuration/modules/gitops/route";
import { codebaseLabels, codebaseType } from "@my-project/shared";
import { Plus } from "lucide-react";
import { CDPipelineList } from "./components/CDPipelineList";
import React from "react";

export default function CDPipelineListPage() {
  const cdPipelinePermissions = useCDPipelinePermissions();
  const { setDialog } = useDialogContext();

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
    <PageWrapper breadcrumbs={[{ label: "Deployment Flows" }]}>
      <Section
        description={
          <>
            Orchestrate and Monitor Your Deployment Flows.{" "}
            <LearnMoreLink url={EDP_USER_GUIDE.CD_PIPELINE_CREATE.anchors.CREATE_VIA_UI.url} />
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-row justify-end">
            <ButtonWithPermission
              ButtonProps={{
                variant: "default",
                onClick: () =>
                  setDialog(ManageCDPipelineDialog, {
                    CDPipeline: undefined,
                  }),
                disabled: !gitOpsCodebase,
              }}
              allowed={cdPipelinePermissions.data.create.allowed}
              reason={cdPipelinePermissions.data.create.reason}
            >
              <Plus />
              Create Deployment Flow
            </ButtonWithPermission>
          </div>
          <CDPipelineList blockerComponent={renderBlockerIfNoGitOpsCodebase} />
        </div>
      </Section>
    </PageWrapper>
  );
}
