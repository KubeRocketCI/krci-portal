import { StageAppCodebaseCombinedData } from "@/core/k8s/api/groups/KRCI/Stage/hooks/useWatchStageAppCodebasesCombinedData";
import React from "react";

export const useSelection = () => {
  const [selected, setSelected] = React.useState<string[]>([]);

  const handleClickSelectAll = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>, paginatedItems: StageAppCodebaseCombinedData[]) => {
      if (event.target.checked) {
        const newSelected = paginatedItems.map(
          ({
            appCodebase: {
              metadata: { name },
            },
          }) => name
        );
        setSelected(newSelected);
        return;
      }
      setSelected([]);
    },
    [setSelected]
  );

  const handleClickSelectRow = React.useCallback(
    (_event: React.MouseEvent<unknown>, row: StageAppCodebaseCombinedData) => {
      const name = row.appCodebase.metadata.name;
      const selectedIndex = selected.indexOf(name);
      let newSelected: string[] = [];

      if (selectedIndex === -1) {
        newSelected = newSelected.concat(selected, name);
      } else if (selectedIndex === 0) {
        newSelected = newSelected.concat(selected.slice(1));
      } else if (selectedIndex === selected.length - 1) {
        newSelected = newSelected.concat(selected.slice(0, -1));
      } else if (selectedIndex > 0) {
        newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1));
      }

      setSelected(newSelected);
    },
    [selected, setSelected]
  );

  return {
    selected,
    setSelected,
    handleClickSelectAll,
    handleClickSelectRow,
  };
};
