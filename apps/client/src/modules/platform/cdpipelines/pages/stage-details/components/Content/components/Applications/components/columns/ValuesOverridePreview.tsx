import { ResourceIconLink } from "@/core/components/ResourceIconLink";
import { Switch } from "@/core/components/ui/switch";
import { VALUES_OVERRIDE_POSTFIX } from "@/modules/platform/cdpipelines/pages/stage-details/constants";
import { Codebase } from "@my-project/shared";
import { SquareArrowOutUpRight } from "lucide-react";
import { useTypedFormContext } from "../../hooks/useTypedFormContext";
import { GitOpsValuesLink } from "../../hooks/useGitOpsValuesLink";

export const ValuesOverridePreviewColumn = ({
  appCodebase,
  gitOpsValuesLink,
}: {
  appCodebase: Codebase;
  gitOpsValuesLink: GitOpsValuesLink;
}) => {
  const form = useTypedFormContext();
  const fieldName = `${appCodebase.metadata.name}${VALUES_OVERRIDE_POSTFIX}` as const;

  return (
    <form.Field name={fieldName}>
      {(field) => (
        <div className="flex flex-row items-center gap-2">
          <div className="flex w-full flex-row items-center gap-2">
            <div>
              <Switch checked={field.state.value as boolean} disabled />
            </div>
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
