import { FormSwitch } from "@/core/providers/Form/components/FormSwitch";
import { FieldEvent } from "@/core/types/forms";
import {
  ALL_VALUES_OVERRIDE_KEY,
  VALUES_OVERRIDE_POSTFIX,
} from "@/modules/platform/cdpipelines/pages/stage-details/constants";
import { useWatchStageAppCodebasesCombinedData } from "@/modules/platform/cdpipelines/pages/stage-details/hooks";
import { Stack, Tooltip } from "@mui/material";
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
    <Stack spacing={2}>
      {mode === applicationTableMode.configuration && (
        <Stack direction="row" alignItems="center" spacing={1}>
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
        </Stack>
      )}

      <Stack direction="row" spacing={1} alignItems="center" flexWrap="nowrap">
        <div>Values override</div>
        <Tooltip title={"Override default deployment settings with custom configurations."}>
          <Info size={16} />
        </Tooltip>
      </Stack>
    </Stack>
  );
};
