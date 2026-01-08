import { Switch } from "@/core/components/ui/switch";
import {
  ALL_VALUES_OVERRIDE_KEY,
  VALUES_OVERRIDE_POSTFIX,
} from "@/modules/platform/cdpipelines/pages/stage-details/constants";
import { usePipelineAppCodebasesWatch } from "@/modules/platform/cdpipelines/pages/stage-details/hooks";
import { Tooltip } from "@/core/components/ui/tooltip";
import { Info } from "lucide-react";
import React from "react";
import { applicationTableMode } from "../../constants";
import { useTypedFormContext } from "../../hooks/useTypedFormContext";
import { ApplicationsTableMode } from "../../types";

export const ValuesOverrideHeadColumn = ({ mode }: { mode: ApplicationsTableMode }) => {
  const pipelineAppCodebasesWatch = usePipelineAppCodebasesWatch();
  const form = useTypedFormContext();
  const fieldId = React.useId();

  return (
    <div className="flex flex-col gap-4">
      {mode === applicationTableMode.configuration && (
        <div className="flex flex-row items-center gap-2">
          <div>
            <form.Field name={ALL_VALUES_OVERRIDE_KEY}>
              {(field) => {
                const handleChange = (checked: boolean) => {
                  if (pipelineAppCodebasesWatch.isLoading || !pipelineAppCodebasesWatch.data.length) {
                    return;
                  }

                  // Update global switch value
                  field.handleChange(checked);

                  // Update all individual switches synchronously
                  for (const appCodebase of pipelineAppCodebasesWatch.data) {
                    const fieldName = `${appCodebase.metadata.name}${VALUES_OVERRIDE_POSTFIX}` as const;
                    form.setFieldValue(fieldName, checked);
                  }
                };

                return <Switch checked={!!field.state.value} onCheckedChange={handleChange} id={fieldId} />;
              }}
            </form.Field>
          </div>
        </div>
      )}

      <div className="flex flex-row flex-nowrap items-center gap-2">
        <div>Values override</div>
        <Tooltip title={"Override default deployment settings with custom configurations."}>
          <Info size={16} />
        </Tooltip>
      </div>
    </div>
  );
};
