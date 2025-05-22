import { CODEBASE_TYPE } from "@/core/k8s/constants/codebaseTypes";
import { Codebase } from "@my-project/shared";
import React from "react";

export const useSelection = () => {
  const [selected, setSelected] = React.useState<string[]>([]);

  const handleSelectAllClick = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>, paginatedItems: Codebase[]) => {
      if (event.target.checked) {
        const newSelected = paginatedItems
          .map(({ metadata: { name }, spec: { type } }) => (type === CODEBASE_TYPE.SYSTEM ? null : name))
          .filter(Boolean);
        setSelected(newSelected as string[]);
        return;
      }
      setSelected([]);
    },
    []
  );

  const handleSelectRowClick = React.useCallback(
    (_event: React.MouseEvent<unknown>, row: Codebase) => {
      const isSystemCodebase = row.spec.type === CODEBASE_TYPE.SYSTEM;

      if (isSystemCodebase) {
        return;
      }

      const name = row.metadata.name;
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

  return {
    selected,
    setSelected,
    handleSelectAllClick,
    handleSelectRowClick,
  };
};
