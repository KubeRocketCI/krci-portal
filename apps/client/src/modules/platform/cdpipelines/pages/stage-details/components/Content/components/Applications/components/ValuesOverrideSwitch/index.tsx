import { FormSwitch } from "@/core/providers/Form/components/FormSwitch";
import {
  ALL_VALUES_OVERRIDE_KEY,
  VALUES_OVERRIDE_POSTFIX,
} from "@/modules/platform/cdpipelines/pages/stage-details/constants";
import { Tooltip } from "@mui/material";
import { TriangleAlert } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { applicationTableMode } from "../../constants";
import { ValuesOverrideSwitchProps } from "./types";

export const ValuesOverrideSwitch = ({ enrichedApplicationWithArgoApplication, mode }: ValuesOverrideSwitchProps) => {
  const { application, argoApplication } = enrichedApplicationWithArgoApplication;
  const {
    control,
    formState: { errors },
    register,
    setValue,
    getValues,
    watch,
  } = useFormContext();

  const currentResourceValue = argoApplication ? Object.hasOwn(argoApplication?.spec, "sources") : false;

  const thisFieldValue = watch(`${application.metadata.name}${VALUES_OVERRIDE_POSTFIX}`) as boolean;

  return (
    <div className="flex items-center gap-1 w-full">
      <div>
        <FormSwitch
          label={<></>}
          {...register(`${application.metadata.name}${VALUES_OVERRIDE_POSTFIX}`, {
            onChange: () => {
              const hasAtLeastOneFalse = Object.entries(getValues())
                .filter(([key]) => key.includes(VALUES_OVERRIDE_POSTFIX))
                .some(([, value]) => value === false);

              setValue(ALL_VALUES_OVERRIDE_KEY, !hasAtLeastOneFalse);
            },
          })}
          control={control}
          errors={errors}
          disabled={mode === applicationTableMode.preview}
        />
      </div>
      {mode === applicationTableMode.configuration && thisFieldValue !== currentResourceValue && (
        <div className="leading-none">
          <Tooltip title="Warning: This action will mutate override values usage for this application deployment.">
            <TriangleAlert size={16} />
          </Tooltip>
        </div>
      )}
    </div>
  );
};
