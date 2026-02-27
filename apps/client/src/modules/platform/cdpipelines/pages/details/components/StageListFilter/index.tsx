import React from "react";
import { useStageListWatch } from "../../hooks/data";
import { useStageFilter } from "./hooks/useStageFilter";
import { stagesFilterControlNames } from "./constants";

export const StageListFilter = () => {
  const stageListWatch = useStageListWatch();

  const { form } = useStageFilter();

  const stageSelectOptions = React.useMemo(() => {
    return stageListWatch.data.array.map((stage) => ({
      label: stage.spec.name,
      value: stage.spec.name,
    }));
  }, [stageListWatch.data.array]);

  return (
    <div className="grid grid-cols-12 items-center gap-4">
      <div className="col-span-3">
        <form.AppField name={stagesFilterControlNames.STAGES}>
          {(field) => (
            <field.FormCombobox multiple options={stageSelectOptions} label="Environments" placeholder="Environments" />
          )}
        </form.AppField>
      </div>
    </div>
  );
};
