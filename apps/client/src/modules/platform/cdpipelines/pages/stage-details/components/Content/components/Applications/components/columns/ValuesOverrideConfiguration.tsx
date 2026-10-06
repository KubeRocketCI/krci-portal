import { Application, Codebase } from "@my-project/shared";
import { useTypedFormContext } from "../../hooks/useTypedFormContext";
import { GitOpsValuesLink } from "../../hooks/useGitOpsValuesLink";
import { ResourceIconLink } from "@/core/components/ResourceIconLink";
import { Switch } from "@/core/components/ui/switch";
import { VALUES_OVERRIDE_POSTFIX } from "@/modules/platform/cdpipelines/pages/stage-details/constants";
import { Tooltip } from "@/core/components/ui/tooltip";
import { SquareArrowOutUpRight, TriangleAlert } from "lucide-react";

export const ValuesOverrideConfigurationColumn = ({
  application,
  appCodebase,
  gitOpsValuesLink,
}: {
  application: Application;
  appCodebase: Codebase;
  gitOpsValuesLink: GitOpsValuesLink;
}) => {
  const form = useTypedFormContext();
  const fieldName = `${appCodebase.metadata.name}${VALUES_OVERRIDE_POSTFIX}` as const;

  const currentResourceValue = application ? Object.hasOwn(application?.spec, "sources") : false;

  return (
    <form.Field name={fieldName}>
      {(field) => (
        <div className="flex flex-row items-center gap-2">
          <div className="flex w-full flex-row items-center gap-2">
            <div>
              <Switch
                checked={field.state.value as boolean}
                onCheckedChange={(checked) => field.handleChange(checked as never)}
              />
            </div>
            {field.state.value !== currentResourceValue && (
              <div className="leading-none">
                <Tooltip title="Warning: This action will mutate override values usage for this application deployment.">
                  <TriangleAlert size={16} />
                </Tooltip>
              </div>
            )}
          </div>
          {gitOpsValuesLink && (
            <ResourceIconLink
              tooltip="Go to the Source Code"
              href={gitOpsValuesLink(appCodebase.metadata.name)}
              icon={<SquareArrowOutUpRight className="text-muted-foreground/70" size={16} />}
              name="source code"
            />
          )}
        </div>
      )}
    </form.Field>
  );
};
