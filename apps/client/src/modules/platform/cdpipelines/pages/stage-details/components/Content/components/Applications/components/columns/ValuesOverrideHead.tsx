import { FormSwitch } from "@/core/providers/Form/components/FormSwitch";
import { FieldEvent } from "@/core/types/forms";
import {
  ALL_VALUES_OVERRIDE_KEY,
  VALUES_OVERRIDE_POSTFIX,
} from "@/modules/platform/cdpipelines/pages/stage-details/constants";
import { useWatchStageAppCodebasesCombinedData } from "@/modules/platform/cdpipelines/pages/stage-details/hooks";
import { Tooltip } from "@mui/material";
import { Info } from "lucide-react";
import React from "react";
import { applicationTableMode } from "../../constants";
import { useTypedFormContext } from "../../hooks/useTypedFormContext";
import { ApplicationsTableMode } from "../../types";
import { checkHighlightedButtons } from "../../utils/checkHighlightedButtons";

export const ValuesOverrideHeadColumn = ({ mode }: { mode: ApplicationsTableMode }) => {
  const stageAppCodebasesCombinedDataWatch = useWatchStageAppCodebasesCombinedData();

  const {
    register,
    control,
    formState: { errors },
    setValue,
    watch,
  } = useTypedFormContext();

  const handleClickOverrideValuesAll = React.useCallback(
    (event: FieldEvent<boolean>) => {
      if (stageAppCodebasesCombinedDataWatch.isLoading || !stageAppCodebasesCombinedDataWatch.data) {
        return;
      }

      const appCodebases = stageAppCodebasesCombinedDataWatch.data?.appCodebaseList;

      const boolean = event?.target.value;

      for (const appCodebase of appCodebases) {
        const selectFieldName = `${appCodebase.metadata.name}${VALUES_OVERRIDE_POSTFIX}` as const;

        setValue(selectFieldName, boolean, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    },
    [setValue, stageAppCodebasesCombinedDataWatch.data, stageAppCodebasesCombinedDataWatch.isLoading]
  );

  const values = watch();

  const buttonsHighlighted = checkHighlightedButtons(values);

  return (
    <div className="flex flex-col gap-4">
      {mode === applicationTableMode.configuration && (
        <div className="flex flex-row items-center gap-2">
          <div>
            <FormSwitch
              label={<></>}
              {...register(ALL_VALUES_OVERRIDE_KEY, {
                onChange: handleClickOverrideValuesAll,
              })}
              control={control}
              errors={errors}
              defaultValue={buttonsHighlighted.valuesOverride}
            />
          </div>
        </div>
      )}

      <div className="flex flex-row gap-2 items-center flex-nowrap">
        <div>Values override</div>
        <Tooltip title={"Override default deployment settings with custom configurations."}>
          <Info size={16} />
        </Tooltip>
      </div>
    </div>
  );
};
