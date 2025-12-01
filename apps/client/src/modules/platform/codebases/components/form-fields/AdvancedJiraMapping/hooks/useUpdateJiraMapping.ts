import React from "react";
import { useFormContext } from "react-hook-form";
import { createAdvancedMappingRowName } from "../constants";
import { AdvancedMappingItem, AdvancedMappingRow } from "../types";
import { getJiraIssueMetadataPayloadDefaultValue } from "../utils";

interface UseUpdateJiraMapping {
  setAdvancedMappingRows: React.Dispatch<React.SetStateAction<AdvancedMappingRow[]>>;
  setAdvancedMapping: React.Dispatch<React.SetStateAction<AdvancedMappingItem[]>>;
  jiraIssueMetadataPayloadName: string;
}

export const useUpdateJiraMapping = ({
  setAdvancedMapping,
  setAdvancedMappingRows,
  jiraIssueMetadataPayloadName,
}: UseUpdateJiraMapping) => {
  const { watch, setValue } = useFormContext();

  const jiraIssueMetadataPayloadFieldValue = watch(jiraIssueMetadataPayloadName);

  React.useEffect(() => {
    const newRows = getJiraIssueMetadataPayloadDefaultValue(
      jiraIssueMetadataPayloadFieldValue as string | undefined | null
    );

    for (const { value, jiraPattern } of newRows) {
      setValue(createAdvancedMappingRowName(value), jiraPattern, { shouldDirty: false });
    }

    setAdvancedMapping((prevAdvancedMapping) => {
      return prevAdvancedMapping.map((el) => {
        const [fitItem] = newRows.filter((innerEl) => innerEl.value === el.value);
        return {
          ...el,
          isUsed: !!fitItem,
        };
      });
    });
    setAdvancedMappingRows(newRows);
  }, [
    jiraIssueMetadataPayloadFieldValue,
    setAdvancedMapping,
    setAdvancedMappingRows,
    setValue,
    jiraIssueMetadataPayloadName,
  ]);
};
