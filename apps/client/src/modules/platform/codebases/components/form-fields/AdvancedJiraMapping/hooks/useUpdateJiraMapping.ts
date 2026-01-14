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

function updateMappingWithUsageStatus(
  prevAdvancedMapping: AdvancedMappingItem[],
  newRows: AdvancedMappingRow[]
): AdvancedMappingItem[] {
  return prevAdvancedMapping.map((item) => ({
    ...item,
    isUsed: newRows.some((row) => row.value === item.value),
  }));
}

export function useUpdateJiraMapping({
  setAdvancedMapping,
  setAdvancedMappingRows,
  jiraIssueMetadataPayloadName,
}: UseUpdateJiraMapping): void {
  const { watch, setValue } = useFormContext();

  const jiraIssueMetadataPayloadFieldValue = watch(jiraIssueMetadataPayloadName);

  React.useEffect(() => {
    const newRows = getJiraIssueMetadataPayloadDefaultValue(
      jiraIssueMetadataPayloadFieldValue as string | undefined | null
    );

    for (const { value, jiraPattern } of newRows) {
      setValue(createAdvancedMappingRowName(value), jiraPattern, { shouldDirty: false });
    }

    setAdvancedMapping((prev) => updateMappingWithUsageStatus(prev, newRows));
    setAdvancedMappingRows(newRows);
  }, [
    jiraIssueMetadataPayloadFieldValue,
    setAdvancedMapping,
    setAdvancedMappingRows,
    setValue,
    jiraIssueMetadataPayloadName,
  ]);
}
