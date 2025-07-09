import { SearchControl } from "@/core/providers/Filter/components/Filter/components/SearchControl";
import { FilterControls } from "@/core/providers/Filter/types";
import { mapObjectValuesToSelectOptions } from "@/core/utils/forms/mapToSelectOptions";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { Codebase, codebaseType } from "@my-project/shared";
import React from "react";
import { codebaseListFilterControlNames } from "../../../constants";
import { usePageFilterContext } from "../../../hooks/usePageFilterContext";
import { ComponentListFilterControlNames } from "../../../types";

type FilterControlsType = FilterControls<ComponentListFilterControlNames>;

export const useFilter = (): {
  controls: FilterControlsType;
  filterFunction: (...args: Codebase[]) => boolean;
} => {
  const { filterFunction, setFilterItem } = usePageFilterContext();

  const controls = React.useMemo(
    () => ({
      search: {
        component: <SearchControl />,
      },
      // ...([].length > 1
      //   ? {
      //       namespace: {
      //         component: <NamespaceControl />,
      //       },
      //     }
      //   : {}),
      codebaseType: {
        component: (
          <FormControl fullWidth>
            <InputLabel shrink id="codebase-type">
              Codebase Type
            </InputLabel>
            <Select
              labelId="codebase-type"
              onChange={(e) => setFilterItem(codebaseListFilterControlNames.CODEBASE_TYPE, e.target.value)}
              defaultValue="all"
              fullWidth
            >
              {mapObjectValuesToSelectOptions({
                all: "all",
                ...codebaseType,
              }).map(({ label, value, disabled = false }, idx) => {
                const key = `${label}::${idx}`;

                return (
                  <MenuItem value={value} key={key} disabled={disabled}>
                    {label}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        ),
      },
    }),
    [setFilterItem]
  );

  return { controls, filterFunction };
};
