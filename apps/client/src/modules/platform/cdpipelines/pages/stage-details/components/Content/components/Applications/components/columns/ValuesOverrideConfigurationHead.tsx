import { FormSwitch } from "@/core/providers/Form/components/FormSwitch";
import { FieldEvent } from "@/core/types/forms";
import {
  VALUES_OVERRIDE_POSTFIX,
  ALL_VALUES_OVERRIDE_KEY,
} from "@/modules/platform/cdpipelines/pages/stage-details/constants";
import { Tooltip } from "@/core/components/ui/tooltip";
import { Info } from "lucide-react";
import React from "react";
import { useTypedFormContext } from "../../hooks/useTypedFormContext";
import { usePipelineAppCodebasesWatch } from "@/modules/platform/cdpipelines/pages/stage-details/hooks";
import { checkHighlightedButtons } from "../../utils/checkHighlightedButtons";

export const ValuesOverrideConfigurationHeadColumn = () => {
  const pipelineAppCodebasesWatch = usePipelineAppCodebasesWatch();

  const {
    register,
    control,
    formState: { errors },
    setValue,
    watch,
  } = useTypedFormContext();

  const handleClickOverrideValuesAll = React.useCallback(
    (event: FieldEvent<boolean>) => {
      if (pipelineAppCodebasesWatch.isLoading || !pipelineAppCodebasesWatch.data.length) {
        return;
      }

      const boolean = event?.target.value;

      for (const appCodebase of pipelineAppCodebasesWatch.data) {
        const selectFieldName = `${appCodebase.metadata.name}${VALUES_OVERRIDE_POSTFIX}` as const;

        setValue(selectFieldName, boolean, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    },
    [setValue, pipelineAppCodebasesWatch.data, pipelineAppCodebasesWatch.isLoading]
  );

  const values = watch();

  const buttonsHighlighted = checkHighlightedButtons(values);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row items-center gap-2">
        <div>
          <FormSwitch
            {...register(ALL_VALUES_OVERRIDE_KEY, {
              onChange: handleClickOverrideValuesAll,
            })}
            control={control}
            errors={errors}
            defaultValue={buttonsHighlighted.valuesOverride}
          />
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
