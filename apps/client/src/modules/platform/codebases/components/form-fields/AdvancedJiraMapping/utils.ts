import { SelectOption } from "@/core/types/forms";
import { advancedMappingBase } from "./constants";
import { AdvancedMappingItem, AdvancedMappingRow } from "./types";

// Legacy function for backward compatibility with edit forms
export const getJiraIssueMetadataPayloadDefaultValue = (
  jsonFieldValue: string | undefined | null
): AdvancedMappingRow[] => {
  if (!jsonFieldValue) {
    return [];
  }

  const fieldValues: { [key: string]: string } = JSON.parse(jsonFieldValue);
  const buffer: AdvancedMappingRow[] = [];
  const labelsMap = advancedMappingBase.reduce(
    (acc, cur) => acc.set(cur.value, cur),
    new Map<string, AdvancedMappingItem>()
  );
  for (const [field, value] of Object.entries(fieldValues)) {
    buffer.push({
      label: labelsMap.has(field) ? (labelsMap.get(field)?.label ?? "") : "",
      value: field,
      jiraPattern: value,
    });
  }
  return buffer;
};

// Convert JSON string to array format for useFieldArray
export const jsonToMappingRowsArray = (
  jsonFieldValue: string | undefined | null
): Array<{ field: string; pattern: string }> => {
  if (!jsonFieldValue) {
    return [];
  }

  try {
    const fieldValues: { [key: string]: string } = JSON.parse(jsonFieldValue);
    return Object.entries(fieldValues).map(([field, pattern]) => ({
      field,
      pattern,
    }));
  } catch {
    return [];
  }
};

// Convert array format to JSON string
export const getJiraIssueMetadataPayload = (
  rows: Array<{ field: string; pattern: string }>
): string | null => {
  const buffer = rows.reduce<Record<string, string>>((acc, { field, pattern }) => {
    if (pattern.trim()) {
      acc[field] = pattern;
    }
    return acc;
  }, {});

  return Object.keys(buffer).length > 0 ? JSON.stringify(buffer) : null;
};

// Legacy function for backward compatibility
export const getAdvancedMappingOptions = (advancedMapping: AdvancedMappingItem[]) => {
  return advancedMapping.reduce<SelectOption<string>[]>((acc, cur) => {
    if (!cur.isUsed) {
      acc.push({
        label: cur.label,
        value: cur.value,
      });
    }
    return acc;
  }, []);
};

