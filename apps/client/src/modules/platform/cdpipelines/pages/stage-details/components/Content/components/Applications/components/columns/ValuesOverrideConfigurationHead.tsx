import { Switch } from "@/core/components/ui/switch";
import {
  ALL_VALUES_OVERRIDE_KEY,
  VALUES_OVERRIDE_POSTFIX,
} from "@/modules/platform/cdpipelines/pages/stage-details/constants";
import { Tooltip } from "@/core/components/ui/tooltip";
import { Info } from "lucide-react";
import React from "react";
import { useTypedFormContext } from "../../hooks/useTypedFormContext";
import { ApplicationsFormValues } from "../../types";

export const ValuesOverrideConfigurationHeadColumn = () => {
  const form = useTypedFormContext();
  const fieldId = React.useId();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row items-center gap-2">
        <div>
          <form.Field name={ALL_VALUES_OVERRIDE_KEY}>
            {(field) => {
              const handleSwitchChange = (checked: boolean) => {
                // First, manually set the global switch value with dontRunListeners to prevent form-level onChange
                form.setFieldValue(ALL_VALUES_OVERRIDE_KEY, checked, {
                  dontRunListeners: true,
                  dontValidate: true,
                  dontUpdateMeta: true,
                });

                // Get all individual switch field names from both state.values and defaultValues
                const stateKeys = Object.keys(form.state.values).filter(
                  (key) => key.endsWith(VALUES_OVERRIDE_POSTFIX) && key !== ALL_VALUES_OVERRIDE_KEY
                );
                const defaultKeys = Object.keys(form.options.defaultValues as ApplicationsFormValues).filter(
                  (key) => key.endsWith(VALUES_OVERRIDE_POSTFIX) && key !== ALL_VALUES_OVERRIDE_KEY
                );
                const independentSwitches = Array.from(new Set([...stateKeys, ...defaultKeys]));

                // Set all individual switches to match global switch
                // Use dontRunListeners to prevent form-level onChange from firing
                for (const key of independentSwitches) {
                  form.setFieldValue(key as keyof ApplicationsFormValues, checked, {
                    dontRunListeners: true,
                    dontValidate: true,
                    dontUpdateMeta: true,
                  });
                }
              };

              return <Switch checked={!!field.state.value} onCheckedChange={handleSwitchChange} id={fieldId} />;
            }}
          </form.Field>
        </div>
      </div>

      <div className="flex flex-row flex-nowrap items-center gap-2">
        <div>Values override</div>
        <Tooltip title={"Override default deployment settings with custom configurations."}>
          <Info size={16} />
        </Tooltip>
      </div>
    </div>
  );
};
