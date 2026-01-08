import { ResourceIconLink } from "@/core/components/ResourceIconLink";
import { SwitchField } from "@/core/components/form/SwitchField";
import { LinkCreationService } from "@/k8s/services/link-creation";
import { VALUES_OVERRIDE_POSTFIX } from "@/modules/platform/cdpipelines/pages/stage-details/constants";
import { useGitOpsCodebaseWatch, useGitServersWatch } from "@/modules/platform/cdpipelines/pages/stage-details/hooks";
import { routeStageDetails } from "@/modules/platform/cdpipelines/pages/stage-details/route";
import React from "react";
import { Codebase, GitProvider } from "@my-project/shared";
import { SquareArrowOutUpRight } from "lucide-react";
import { useTypedFormContext } from "../../hooks/useTypedFormContext";

export const ValuesOverridePreviewColumn = ({ appCodebase }: { appCodebase: Codebase }) => {
  const params = routeStageDetails.useParams();
  const gitOpsCodebaseWatch = useGitOpsCodebaseWatch();
  const gitServerListWatch = useGitServersWatch();

  const gitOpsCodebase = gitOpsCodebaseWatch.data;

  const form = useTypedFormContext();
  const fieldName = `${appCodebase.metadata.name}${VALUES_OVERRIDE_POSTFIX}` as const;

  const gitOpsGitServer = React.useMemo(() => {
    return gitServerListWatch.data.array?.find(
      (gitServer) => gitServer.metadata.name === gitOpsCodebase?.spec.gitServer
    );
  }, [gitOpsCodebase?.spec.gitServer, gitServerListWatch.data.array]);

  return (
    <form.Field name={fieldName}>
      {(field) => (
        <div className="flex flex-row items-center gap-2">
          <div className="flex w-full flex-row items-center gap-2">
            <div>
              <SwitchField field={field} disabled />
            </div>
          </div>
          {gitOpsCodebase?.status?.gitWebUrl && (
            <ResourceIconLink
              tooltipTitle={"Go to the Source Code"}
              link={LinkCreationService.git.createGitOpsValuesYamlFileLink(
                gitOpsCodebase?.status?.gitWebUrl,
                params.cdPipeline,
                params.stage,
                appCodebase.metadata.name,
                gitOpsGitServer?.spec.gitProvider as GitProvider
              )}
              Icon={<SquareArrowOutUpRight size={16} />}
              name="source code"
            />
          )}
        </div>
      )}
    </form.Field>
  );
};
