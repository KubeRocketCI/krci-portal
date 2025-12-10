import { Autocomplete as FormAutocomplete } from "@/core/components/form/Autocomplete";
import React from "react";
import { useStageListWatch } from "../../hooks/data";
import { useStageFilter } from "./hooks/useStageFilter";
import { stagesFilterControlNames } from "./constants";

export const StageListFilter = () => {
  const stageListWatch = useStageListWatch();

  const { form } = useStageFilter();

  const stageSelectOptions = React.useMemo(() => {
    return stageListWatch.data.array.map((stage) => stage.spec.name);
  }, [stageListWatch.data.array]);

  return (
    <div className="grid grid-cols-12 items-center gap-4">
      <div className="col-span-3">
        <form.Field name={stagesFilterControlNames.STAGES}>
          {(field) => (
            <FormAutocomplete
              field={field}
              multiple
              options={stageSelectOptions}
              label="Environments"
              placeholder="Environments"
              getOptionLabel={(option) => option as string}
              ChipProps={{ size: "small", color: "primary" }}
            />
          )}
        </form.Field>
      </div>
    </div>
  );
};
