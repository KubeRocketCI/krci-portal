import React from "react";
import { useStore } from "@tanstack/react-form";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Trash2 } from "lucide-react";
import { useCreateCodebaseForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../names";

const ADVANCED_MAPPING_BASE = [
  { label: "Component/s", value: "components" },
  { label: "FixVersion/s", value: "fixVersions" },
  { label: "Labels", value: "labels" },
];

const getJiraIssueMetadataPayload = (rows: Array<{ field: string; pattern: string }>): string | null => {
  const buffer = rows.reduce<Record<string, string>>((acc, { field, pattern }) => {
    if (pattern.trim()) acc[field] = pattern;
    return acc;
  }, {});
  return Object.keys(buffer).length > 0 ? JSON.stringify(buffer) : null;
};

const advancedMappingOptions = ADVANCED_MAPPING_BASE.map((item) => ({ label: item.label, value: item.value }));

export const AdvancedJiraMapping: React.FC = () => {
  const form = useCreateCodebaseForm();
  const mappingRows = useStore(
    form.store,
    (s) => (s.values[NAMES.ui_advancedMappingRows] as Array<{ field: string; pattern: string }>) || []
  );
  const selectedFields = useStore(form.store, (s) => (s.values[NAMES.ui_advancedMappingFieldName] as string[]) || []);
  const hasJiraIntegration = useStore(form.store, (s) => s.values[NAMES.ui_hasJiraServerIntegration]);

  const updateJiraPayload = React.useCallback(
    (rows: Array<{ field: string; pattern: string }>) => {
      form.setFieldValue(NAMES.jiraIssueMetadataPayload, getJiraIssueMetadataPayload(rows));
    },
    [form]
  );

  const handleMappingFieldChanges = React.useCallback(
    (newFields: string[]) => {
      const currentRows = form.getFieldValue(NAMES.ui_advancedMappingRows) || [];
      const prevFields = (currentRows as Array<{ field: string; pattern: string }>).map((row) => row.field);
      const addedFields = newFields.filter((f) => !prevFields.includes(f));
      const removedFields = prevFields.filter((f) => !newFields.includes(f));
      let newRows = [...(currentRows as Array<{ field: string; pattern: string }>)];
      addedFields.forEach((field) => newRows.push({ field, pattern: "" }));
      newRows = newRows.filter((row) => !removedFields.includes(row.field));
      form.setFieldValue(NAMES.ui_advancedMappingRows, newRows);
      updateJiraPayload(newRows);
    },
    [form, updateJiraPayload]
  );

  const handlePatternBlur = React.useCallback(() => {
    const currentRows = form.getFieldValue(NAMES.ui_advancedMappingRows) || [];
    updateJiraPayload(currentRows as Array<{ field: string; pattern: string }>);
  }, [form, updateJiraPayload]);

  const handleDeleteMappingRow = React.useCallback(
    (index: number) => {
      const currentRows = form.getFieldValue(NAMES.ui_advancedMappingRows) || [];
      const rowToRemove = (currentRows as Array<{ field: string; pattern: string }>)[index];
      if (rowToRemove) {
        const newRows = (currentRows as Array<{ field: string; pattern: string }>).filter((_, idx) => idx !== index);
        const newSelectedFields = selectedFields.filter((f) => f !== rowToRemove.field);
        form.setFieldValue(NAMES.ui_advancedMappingRows, newRows);
        form.setFieldValue(NAMES.ui_advancedMappingFieldName, newSelectedFields);
        updateJiraPayload(newRows);
      }
    },
    [form, selectedFields, updateJiraPayload]
  );

  return (
    <div className="flex flex-col gap-4">
      <form.AppField
        name={NAMES.ui_advancedMappingFieldName}
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
      <div>
        <div className="flex flex-col gap-4">
          {mappingRows.length > 0 ? (
            mappingRows.map((rowData, idx) => {
              const mappingItem = ADVANCED_MAPPING_BASE.find((item) => item.value === rowData.field);
              if (!mappingItem) return null;
              return (
                <div key={rowData.field}>
                  <div className="flex items-center gap-4">
                    <div className="grow">
                      <Input disabled value={mappingItem.label} className="w-full" />
                    </div>
                    <div className="grow">
                      <form.AppField
                        name={`${NAMES.ui_advancedMappingRows}[${idx}].pattern` as "ui_advancedMappingRows"}
                        validators={{
                          onChange: ({ value }) => {
                            // Only validate if Jira integration is enabled
                            if (!hasJiraIntegration) {
                              return undefined;
                            }
                            return !value ? "Add at least one variable." : undefined;
                          },
                        }}
                        listeners={{ onBlur: handlePatternBlur }}
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
            })
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
