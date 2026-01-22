import { Application, Codebase, GitProvider } from "@my-project/shared";
import { useTypedFormContext } from "../../hooks/useTypedFormContext";
import { ResourceIconLink } from "@/core/components/ResourceIconLink";
import { SwitchField } from "@/core/components/form/SwitchField";
import { LinkCreationService } from "@/k8s/services/link-creation";
import { VALUES_OVERRIDE_POSTFIX } from "@/modules/platform/cdpipelines/pages/stage-details/constants";
import { Tooltip } from "@/core/components/ui/tooltip";
import { SquareArrowOutUpRight, TriangleAlert } from "lucide-react";
import { routeStageDetails } from "@/modules/platform/cdpipelines/pages/stage-details/route";
import React from "react";
import { useGitOpsCodebaseWatch, useGitServersWatch } from "@/modules/platform/cdpipelines/pages/stage-details/hooks";

export const ValuesOverrideConfigurationColumn = ({
  application,
  appCodebase,
}: {
  application: Application;
  appCodebase: Codebase;
}) => {
  const params = routeStageDetails.useParams();
  const gitOpsCodebaseWatch = useGitOpsCodebaseWatch();
  const gitServerListWatch = useGitServersWatch();

  const gitOpsCodebase = gitOpsCodebaseWatch.data;

  const form = useTypedFormContext();
  const fieldName = `${appCodebase.metadata.name}${VALUES_OVERRIDE_POSTFIX}` as const;

  const currentResourceValue = application ? Object.hasOwn(application?.spec, "sources") : false;

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
              <SwitchField field={field} />
            </div>
            {field.state.value !== currentResourceValue && (
              <div className="leading-none">
                <Tooltip title="Warning: This action will mutate override values usage for this application deployment.">
                  <TriangleAlert size={16} />
                </Tooltip>
              </div>
            )}
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
              Icon={<SquareArrowOutUpRight className="text-muted-foreground/70" size={16} />}
              name="source code"
            />
          )}
        </div>
      )}
    </form.Field>
  );
};
