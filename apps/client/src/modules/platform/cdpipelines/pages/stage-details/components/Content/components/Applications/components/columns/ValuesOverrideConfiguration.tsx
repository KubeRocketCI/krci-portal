import { Application, Codebase, GitProvider } from "@my-project/shared";
import { useTypedFormContext } from "../../hooks/useTypedFormContext";
import { ResourceIconLink } from "@/core/components/ResourceIconLink";
import { FormSwitch } from "@/core/providers/Form/components/FormSwitch";
import { LinkCreationService } from "@/k8s/services/link-creation";
import {
  VALUES_OVERRIDE_POSTFIX,
  ALL_VALUES_OVERRIDE_KEY,
} from "@/modules/platform/cdpipelines/pages/stage-details/constants";
import { Tooltip } from "@mui/material";
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

  const {
    control,
    formState: { errors },
    register,
    setValue,
    getValues,
    watch,
  } = useTypedFormContext();
  const currentResourceValue = application ? Object.hasOwn(application?.spec, "sources") : false;

  const thisFieldValue = watch(`${appCodebase.metadata.name}${VALUES_OVERRIDE_POSTFIX}`);

  const gitOpsGitServer = React.useMemo(() => {
    return gitServerListWatch.data.array?.find(
      (gitServer) => gitServer.metadata.name === gitOpsCodebase?.spec.gitServer
    );
  }, [gitOpsCodebase?.spec.gitServer, gitServerListWatch.data.array]);

  return (
    <div className="flex flex-row items-center gap-2">
      <div className="flex flex-row items-center gap-2 w-full">
        <div>
          <FormSwitch
            label={<></>}
            {...register(`${appCodebase.metadata.name}${VALUES_OVERRIDE_POSTFIX}`, {
              onChange: () => {
                const hasAtLeastOneFalse = Object.entries(getValues())
                  .filter(([key]) => key.includes(VALUES_OVERRIDE_POSTFIX))
                  .some(([, value]) => value === false);

                setValue(ALL_VALUES_OVERRIDE_KEY, !hasAtLeastOneFalse);
              },
            })}
            control={control}
            errors={errors}
          />
        </div>
        {thisFieldValue !== currentResourceValue && (
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
          Icon={<SquareArrowOutUpRight size={16} />}
          name="source code"
        />
      )}
    </div>
  );
};
