import React from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { CREATE_WIZARD_NAMES } from "../names";
import { AdvancedJiraMappingRow } from "./components/AdvancedJiraMappingRow";
import { advancedMappingBase } from "./constants";
import { getJiraIssueMetadataPayload } from "./utils";
import { FormComboboxMultiple } from "@/core/providers/Form/components/FormComboboxMultiple";
import { SelectOption } from "@/core/types/forms";
import { FieldEvent } from "@/core/types/forms";

type MappingRow = {
  field: string;
  pattern: string;
};

interface AdvancedJiraMappingFieldProps {
  name?: string;
  advancedMappingPatternName?: string; // Not used in new approach, kept for compatibility
}

export const AdvancedJiraMappingField: React.FC<AdvancedJiraMappingFieldProps> = ({
  name = CREATE_WIZARD_NAMES.ui_advancedMappingFieldName,
  // advancedMappingPatternName - Not used but kept for API compatibility
}) => {
  const {
    register,
    control,
    formState: { errors },
    watch,
    setValue,
    getValues,
  } = useFormContext();

  const mappingRowsFieldName = CREATE_WIZARD_NAMES.ui_advancedMappingRows;
  const jiraIssueMetadataPayloadFieldName = CREATE_WIZARD_NAMES.jiraIssueMetadataPayload;

  const mappingRowsRaw = watch(mappingRowsFieldName);
  const selectedFieldsRaw = watch(name);

  const mappingRows: MappingRow[] = React.useMemo(() => {
    return (mappingRowsRaw as MappingRow[] | undefined) || [];
  }, [mappingRowsRaw]);

  const selectedFields: string[] = React.useMemo(() => {
    return (selectedFieldsRaw as string[] | undefined) || [];
  }, [selectedFieldsRaw]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: mappingRowsFieldName,
  });

  const advancedMappingOptions: SelectOption<string>[] = React.useMemo(() => {
    return advancedMappingBase.map((item) => ({
      label: item.label,
      value: item.value,
    }));
  }, []);

  const updateJiraPayload = React.useCallback(
    (rows: MappingRow[]) => {
      const jsonPayload = getJiraIssueMetadataPayload(rows);
      setValue(jiraIssueMetadataPayloadFieldName, jsonPayload);
    },
    [setValue, jiraIssueMetadataPayloadFieldName]
  );

  const handleMappingFieldChanges = React.useCallback(
    (newFields: string[]) => {
      const prevFields = mappingRows.map((row: MappingRow) => row.field);
      const addedFields = newFields.filter((field) => !prevFields.includes(field));

      // Add new fields
      addedFields.forEach((field) => {
        append({
          field,
          pattern: "",
        });
      });

      // Remove deselected fields
      const removedFields = prevFields.filter((field) => !newFields.includes(field));
      const removedIndices = removedFields
        .map((field) => mappingRows.findIndex((row: MappingRow) => row.field === field))
        .filter((idx) => idx !== -1);

      removedIndices.reverse().forEach((index) => {
        remove(index);
      });

      // Get updated rows from form state after append/remove operations
      const updatedRows = (getValues(mappingRowsFieldName) as MappingRow[] | undefined) || [];

      // Update payload synchronously with the latest form state
      updateJiraPayload(updatedRows);
    },
    [mappingRows, append, remove, getValues, updateJiraPayload, mappingRowsFieldName]
  );

  const handlePatternChange = React.useCallback(() => {
    // Get current form values to get the latest pattern values
    const currentRows = (getValues(mappingRowsFieldName) as MappingRow[] | undefined) || [];
    updateJiraPayload(currentRows);
  }, [getValues, updateJiraPayload, mappingRowsFieldName]);

  const handleDeleteMappingRow = React.useCallback(
    (index: number) => {
      const rowToRemove = mappingRows[index];
      if (rowToRemove) {
        remove(index);
        const newSelectedFields = selectedFields.filter((field) => field !== rowToRemove.field);
        setValue(name, newSelectedFields);

        // Get updated rows from form state after remove operation
        const updatedRows = (getValues(mappingRowsFieldName) as MappingRow[] | undefined) || [];
        updateJiraPayload(updatedRows);
      }
    },
    [mappingRows, selectedFields, remove, setValue, getValues, updateJiraPayload, name, mappingRowsFieldName]
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <FormComboboxMultiple
          {...register(name, {
            onChange: ({ target: { value } }: FieldEvent<string[]>) => handleMappingFieldChanges(value),
          })}
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
          options={advancedMappingOptions}
          placeholder="Select mapping fields"
        />
      </div>
      <div>
        <div className="flex flex-col gap-4">
          {fields.length > 0 ? (
            <>
              {fields.map((fieldItem, idx) => {
                const rowData = mappingRows[idx];
                if (!rowData) return null;

                const mappingItem = advancedMappingBase.find((item) => item.value === rowData.field);
                if (!mappingItem) return null;

                return (
                  <AdvancedJiraMappingRow
                    key={fieldItem.id}
                    index={idx}
                    label={mappingItem.label}
                    field={rowData.field}
                    onDelete={handleDeleteMappingRow}
                    onPatternChange={handlePatternChange}
                  />
                );
              })}
            </>
          ) : (
            <div className="border-input flex h-[70px] items-center justify-center rounded border border-dashed p-4">
              <p className="text-muted-foreground text-sm">
                Select mapping fields from the dropdown above to configure Jira patterns.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
