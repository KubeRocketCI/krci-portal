import React from "react";
import { useFormContext } from "react-hook-form";
import { AdvancedMappingRow } from "../types";
import { getJiraIssueMetadataPayload } from "../utils";
import { FieldEvent } from "@/core/types/forms";

interface UseOnChangeJiraPatternProps {
  setAdvancedMappingRows: React.Dispatch<React.SetStateAction<AdvancedMappingRow[]>>;
  jiraIssueMetadataPayloadName: string;
}

export const useOnChangeJiraPattern = ({
  setAdvancedMappingRows,
  jiraIssueMetadataPayloadName,
}: UseOnChangeJiraPatternProps): {
  onChangeJiraPattern: (event: FieldEvent, value: string) => void;
} => {
  const { setValue } = useFormContext();

  const onChangeJiraPattern = React.useCallback(
    (event: FieldEvent, value: string) => {
      setAdvancedMappingRows((prev) => {
        const newRows = prev.map((el) => {
          if (el.value === value) {
            return {
              ...el,
              jiraPattern: event.target.value as string,
            };
          }
          return el;
        });

        const newJiraIssueMetadataPayload = getJiraIssueMetadataPayload(
          newRows.map((row) => ({ field: row.value, pattern: row.jiraPattern }))
        );

        if (newJiraIssueMetadataPayload) {
          setValue(jiraIssueMetadataPayloadName, newJiraIssueMetadataPayload);
        }
        return newRows;
      });
    },
    [setAdvancedMappingRows, setValue, jiraIssueMetadataPayloadName]
  );

  return { onChangeJiraPattern };
};
