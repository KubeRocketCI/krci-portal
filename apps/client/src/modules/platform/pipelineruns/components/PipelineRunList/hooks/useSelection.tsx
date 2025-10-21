import React from "react";
import { PipelineRun } from "@my-project/shared";

export const useSelection = () => {
  const [selected, setSelected] = React.useState<string[]>([]);

  const handleSelectAllClick = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>, paginatedItems: PipelineRun[]) => {
      if (event.target.checked) {
        const newSelected = paginatedItems.map((item) => item.metadata.name);
        setSelected(newSelected);
        return;
      }
      setSelected([]);
    },
    []
  );

  const handleSelectRowClick = React.useCallback(
    (_event: React.MouseEvent<unknown>, row: PipelineRun) => {
      const name = row.metadata?.name;

      if (!name) {
        return;
      }

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
    [selected]
  );

  return { selected, setSelected, handleSelectAllClick, handleSelectRowClick };
};
