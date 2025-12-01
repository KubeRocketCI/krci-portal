import React from "react";
import { useFormContext } from "react-hook-form";
import { AdvancedMappingItem, AdvancedMappingRow } from "../types";

interface UseHandleAddMappingRowProps {
  setAdvancedMappingRows: React.Dispatch<React.SetStateAction<AdvancedMappingRow[]>>;
  setAdvancedMapping: React.Dispatch<React.SetStateAction<AdvancedMappingItem[]>>;
  advancedMapping: AdvancedMappingItem[];
  advancedMappingFieldName: string;
}

export const useHandleAddMappingRow = ({
  setAdvancedMappingRows,
  setAdvancedMapping,
  advancedMapping,
  advancedMappingFieldName,
}: UseHandleAddMappingRowProps): { handleAddMappingRow: () => void } => {
  const { setValue, watch } = useFormContext();

  const advancedMappingFieldNameValue = watch(advancedMappingFieldName);

  const handleAddMappingRow = React.useCallback(() => {
    setAdvancedMapping((prev) => {
      return prev.map((el) => {
        if (el.value === advancedMappingFieldNameValue) {
          return {
            ...el,
            isUsed: true,
          };
        }

        return el;
      });
    });
    setAdvancedMappingRows((prev) => {
      const [advancedMappingItemFitByName] = advancedMapping.filter(
        ({ value }) => value === advancedMappingFieldNameValue
      );

      return [
        ...prev,
        {
          label: advancedMappingItemFitByName.label,
          value: advancedMappingItemFitByName.value,
          jiraPattern: "",
        },
      ];
    });
    setValue(advancedMappingFieldName, "");
  }, [
    advancedMapping,
    advancedMappingFieldNameValue,
    setAdvancedMapping,
    setAdvancedMappingRows,
    setValue,
    advancedMappingFieldName,
  ]);

  return { handleAddMappingRow };
};
