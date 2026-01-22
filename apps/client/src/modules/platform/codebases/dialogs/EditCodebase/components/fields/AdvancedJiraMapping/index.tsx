import React from "react";
import { Input } from "@/core/components/ui/input";
import { Button } from "@/core/components/ui/button";
import { Trash2 } from "lucide-react";
import { EDIT_CODEBASE_FORM_NAMES, MappingRow } from "../../../types";
import { useEditCodebaseForm } from "../../../providers/form/hooks";
import { SelectOption } from "@/core/types/forms";
import { useStore } from "@tanstack/react-form";

// Advanced mapping options
const advancedMappingBase = [
  { label: "Component/s", value: "components" },
  { label: "FixVersion/s", value: "fixVersions" },
  { label: "Labels", value: "labels" },
];

// Convert array format to JSON string
const getJiraIssueMetadataPayload = (rows: MappingRow[]): string | null => {
  const buffer = rows.reduce<Record<string, string>>((acc, { field, pattern }) => {
    if (pattern.trim()) {
      acc[field] = pattern;
    }
    return acc;
  }, {});

  return Object.keys(buffer).length > 0 ? JSON.stringify(buffer) : null;
};

export const AdvancedJiraMapping = () => {
  const form = useEditCodebaseForm();

  // Subscribe to form values
  const mappingRows = useStore(form.store, (state) => state.values[EDIT_CODEBASE_FORM_NAMES.advancedMappingRows] || []);
  const selectedFields = useStore(
    form.store,
    (state) => state.values[EDIT_CODEBASE_FORM_NAMES.advancedMappingFieldName] || []
  );

  const advancedMappingOptions: SelectOption<string>[] = React.useMemo(() => {
    return advancedMappingBase.map((item) => ({
      label: item.label,
      value: item.value,
    }));
  }, []);

  const updateJiraPayload = React.useCallback(
    (rows: MappingRow[]) => {
      const jsonPayload = getJiraIssueMetadataPayload(rows);
      form.setFieldValue(EDIT_CODEBASE_FORM_NAMES.jiraIssueMetadataPayload, jsonPayload);
    },
    [form]
  );

  const handleMappingFieldChanges = React.useCallback(
    (newFields: string[]) => {
      const currentRows = form.getFieldValue(EDIT_CODEBASE_FORM_NAMES.advancedMappingRows) || [];
      const prevFields = currentRows.map((row: MappingRow) => row.field);

      // Find added fields
      const addedFields = newFields.filter((field) => !prevFields.includes(field));

      // Find removed fields
      const removedFields = prevFields.filter((field: string) => !newFields.includes(field));

      // Create new rows array
      let newRows = [...currentRows];

      // Add new fields
      addedFields.forEach((field) => {
        newRows.push({ field, pattern: "" });
      });

      // Remove deselected fields
      newRows = newRows.filter((row: MappingRow) => !removedFields.includes(row.field));

      // Update form values
      form.setFieldValue(EDIT_CODEBASE_FORM_NAMES.advancedMappingRows, newRows);
      updateJiraPayload(newRows);
    },
    [form, updateJiraPayload]
  );

  // Update jira payload when any pattern changes
  const handlePatternBlur = React.useCallback(() => {
    const currentRows = form.getFieldValue(EDIT_CODEBASE_FORM_NAMES.advancedMappingRows) || [];
    updateJiraPayload(currentRows);
  }, [form, updateJiraPayload]);

  const handleDeleteMappingRow = React.useCallback(
    (index: number) => {
      const currentRows = form.getFieldValue(EDIT_CODEBASE_FORM_NAMES.advancedMappingRows) || [];
      const rowToRemove = currentRows[index];

      if (rowToRemove) {
        const newRows = currentRows.filter((_: MappingRow, idx: number) => idx !== index);
        const newSelectedFields = selectedFields.filter((field: string) => field !== rowToRemove.field);

        form.setFieldValue(EDIT_CODEBASE_FORM_NAMES.advancedMappingRows, newRows);
        form.setFieldValue(EDIT_CODEBASE_FORM_NAMES.advancedMappingFieldName, newSelectedFields);
        updateJiraPayload(newRows);
      }
    },
    [form, selectedFields, updateJiraPayload]
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <form.AppField
          name={EDIT_CODEBASE_FORM_NAMES.advancedMappingFieldName}
          listeners={{
            onChange: ({ value }) => handleMappingFieldChanges(value as string[]),
          }}
        >
          {(field) => (
            <field.FormCombobox
              label="Mapping field name"
              tooltipText={
                <div>
                  <p>
                    There are four predefined variables with the respective values that can be specified singly or as a
                    combination: <br />
                  </p>
                  <ul>
                    <li>
                      <b>QUICK_LINK</b> – returns application-name <br />
                    </li>
                    <li>
                      <b>EDP_VERSION</b> – returns <b>0.0.0-SNAPSHOT</b> or <b>0.0.0-RC</b> <br />
                    </li>
                    <li>
                      <b>EDP_SEM_VERSION</b> – returns <b>0.0.0</b> <br />
                    </li>
                    <li>
                      <b>EDP_GITTAG</b> – returns <b>build/0.0.0-SNAPSHOT.2</b> or <b>build/0.0.0-RC.2</b> <br />
                    </li>
                  </ul>
                  <em>
                    There are no character restrictions when combining the variables, combination samples:
                    <b>EDP_SEM_VERSION-QUICK_LINK</b> or <b>QUICK_LINK-hello-world/EDP_VERSION</b>, etc.
                  </em>
                </div>
              }
              options={advancedMappingOptions}
              placeholder="Select mapping fields"
              multiple
            />
          )}
        </form.AppField>
      </div>
      <div>
        <div className="flex flex-col gap-4">
          {mappingRows.length > 0 ? (
            <>
              {mappingRows.map((rowData: MappingRow, idx: number) => {
                const mappingItem = advancedMappingBase.find((item) => item.value === rowData.field);
                if (!mappingItem) return null;

                return (
                  <div key={rowData.field}>
                    <div className="flex items-center gap-4">
                      <div className="grow">
                        <Input disabled value={mappingItem.label} className="w-full" />
                      </div>
                      <div className="grow">
                        <form.AppField
                          name={
                            `${EDIT_CODEBASE_FORM_NAMES.advancedMappingRows}[${idx}].pattern` as "advancedMappingRows"
                          }
                          validators={{
                            onChange: ({ value }) => {
                              if (!value) return "Add at least one variable.";
                              return undefined;
                            },
                          }}
                          listeners={{
                            onBlur: handlePatternBlur,
                          }}
                        >
                          {(field) => <field.FormTextField placeholder="Enter Jira pattern" />}
                        </form.AppField>
                      </div>
                      <div className="shrink">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="min-w-0"
                          onClick={() => handleDeleteMappingRow(idx)}
                        >
                          <Trash2 size={20} className="text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  </div>
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
