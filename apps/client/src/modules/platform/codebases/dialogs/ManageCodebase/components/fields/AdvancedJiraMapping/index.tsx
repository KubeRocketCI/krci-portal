import { Button } from "@mui/material";
import React from "react";
import { useTypedFormContext } from "../../../hooks/useFormContext";
import { CODEBASE_FORM_NAMES } from "../../../names";
import { AdvancedJiraMappingRow } from "./components/AdvancedJiraMappingRow";
import { advancedMappingBase } from "./constants";
import { useHandleAddMappingRow } from "./hooks/useHandleAddMappingRow";
import { useHandleDeleteMappingRow } from "./hooks/useHandleDeleteMappingRow";
import { useOnChangeJiraPattern } from "./hooks/useOnChangeJiraPattern";
import { useUpdateJiraMapping } from "./hooks/useUpdateJiraMapping";
import { AdvancedMappingItem, AdvancedMappingRow } from "./types";
import { getAdvancedMappingOptions } from "./utils";
import { FormSelect } from "@/core/providers/Form/components/FormSelect";
import { SelectOption } from "@/core/types/forms";

export const AdvancedJiraMapping = () => {
  const {
    register,
    control,
    formState: { errors },
    watch,
  } = useTypedFormContext();

  const advancedMappingFieldNameValue = watch(CODEBASE_FORM_NAMES.advancedMappingFieldName.name);

  const [advancedMapping, setAdvancedMapping] = React.useState<AdvancedMappingItem[]>(advancedMappingBase);

  const [advancedMappingRows, setAdvancedMappingRows] = React.useState<AdvancedMappingRow[]>([]);

  const advancedMappingOptions: SelectOption<string>[] = React.useMemo(
    () => getAdvancedMappingOptions(advancedMapping),
    [advancedMapping]
  );

  const advancedMappingFieldNameIsDisabled: boolean = React.useMemo(() => {
    return !advancedMapping.filter(({ isUsed }) => isUsed === false).length;
  }, [advancedMapping]);

  const { onChangeJiraPattern } = useOnChangeJiraPattern({
    setAdvancedMappingRows,
  });

  const { handleDeleteMappingRow } = useHandleDeleteMappingRow({
    setAdvancedMappingRows,
    setAdvancedMapping,
  });

  const { handleAddMappingRow } = useHandleAddMappingRow({
    setAdvancedMappingRows,
    setAdvancedMapping,
    advancedMapping,
  });

  useUpdateJiraMapping({ setAdvancedMapping, setAdvancedMappingRows });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-10">
            <FormSelect
              {...register(CODEBASE_FORM_NAMES.advancedMappingFieldName.name)}
              label={"Mapping field name"}
              tooltipText={
                <div>
                  <p>
                    There are four predefined variables with the respective values that can be specified singly or as a
                    combination: <br />
                  </p>
                  <ul>
                    <li>
                      {" "}
                      <b>QUICK_LINK</b> – returns application-name <br />
                    </li>
                    <li>
                      {" "}
                      <b>EDP_VERSION</b> – returns <b>0.0.0-SNAPSHOT</b> or <b>0.0.0-RC</b> <br />
                    </li>
                    <li>
                      {" "}
                      <b>EDP_SEM_VERSION</b> – returns <b>0.0.0</b> <br />
                    </li>
                    <li>
                      {" "}
                      <b>EDP_GITTAG</b> – returns <b>build/0.0.0-SNAPSHOT.2</b> or <b>build/0.0.0-RC.2</b> <br />
                    </li>
                  </ul>
                  <em>
                    There are no character restrictions when combining the variables, combination samples:
                    <b>EDP_SEM_VERSION-QUICK_LINK</b> or <b>QUICK_LINK-hello-world/EDP_VERSION</b>, etc.
                  </em>
                </div>
              }
              control={control}
              errors={errors}
              disabled={advancedMappingFieldNameIsDisabled}
              options={advancedMappingOptions}
            />
          </div>
          <div className="col-span-2 flex flex-col items-center justify-end">
            <Button
              type={"button"}
              size={"small"}
              component={"button"}
              style={{ minWidth: 0 }}
              variant={"contained"}
              disabled={!advancedMappingFieldNameValue}
              onClick={handleAddMappingRow}
            >
              add
            </Button>
          </div>
        </div>
      </div>
      <div>
        <div className="flex flex-col gap-0">
          {advancedMappingRows.length ? (
            <>
              {advancedMappingRows.map(({ label, value }, idx) => {
                const key = `${value}::${idx}`;

                return (
                  <AdvancedJiraMappingRow
                    key={key}
                    label={label}
                    value={value}
                    onChangeJiraPattern={onChangeJiraPattern}
                    handleDeleteMappingRow={handleDeleteMappingRow}
                  />
                );
              })}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
