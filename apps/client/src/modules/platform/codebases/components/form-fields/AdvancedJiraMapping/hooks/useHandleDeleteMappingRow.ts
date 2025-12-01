import React from "react";
import { useFormContext } from "react-hook-form";
import { createAdvancedMappingRowName } from "../constants";
import { AdvancedMappingItem, AdvancedMappingRow } from "../types";
import { getJiraIssueMetadataPayload } from "../utils";

interface UseHandleDeleteMappingRowProps {
  setAdvancedMappingRows: React.Dispatch<React.SetStateAction<AdvancedMappingRow[]>>;
  setAdvancedMapping: React.Dispatch<React.SetStateAction<AdvancedMappingItem[]>>;
  jiraIssueMetadataPayloadName: string;
}

export const useHandleDeleteMappingRow = ({
  setAdvancedMappingRows,
  setAdvancedMapping,
  jiraIssueMetadataPayloadName,
}: UseHandleDeleteMappingRowProps): { handleDeleteMappingRow: (value: string) => void } => {
  const { setValue, resetField } = useFormContext();

  const handleDeleteMappingRow = React.useCallback(
    (value: string) => {
      setAdvancedMappingRows((prev) => {
        const newRows = prev.filter(({ value: innerValue }) => innerValue !== value);
        const newJiraIssueMetadataPayload = getJiraIssueMetadataPayload(
          newRows.map((row) => ({ field: row.value, pattern: row.jiraPattern }))
        );
        setValue(jiraIssueMetadataPayloadName, newJiraIssueMetadataPayload);
        return newRows;
      });
      setAdvancedMapping((prev) => {
        return prev.map((el) => {
          if (el.value === value) {
            return {
              ...el,
              isUsed: false,
            };
          }

          return el;
        });
      });
      resetField(createAdvancedMappingRowName(value));
    },
    [resetField, setAdvancedMapping, setAdvancedMappingRows, setValue, jiraIssueMetadataPayloadName]
  );

  return { handleDeleteMappingRow };
};
