import { KubeObjectBase } from "@my-project/shared";
import React from "react";
import { LOCAL_STORAGE_SERVICE } from "../../services/local-storage";
import { namespaceFunction, searchFunction } from "./constants";
import { FilterContext } from "./context";
import { DefaultControlNames, FilterContextProviderProps, FilterState } from "./types";

const LS_FILTER_KEY = "FILTER_STATE";

type DefaultFilterState = FilterState<KubeObjectBase, DefaultControlNames>;

const defaultInitialFilterState: DefaultFilterState = {
  values: {
    search: "",
    namespace: "",
  },
  matchFunctions: {
    search: searchFunction,
    namespace: namespaceFunction,
  },
};

export const FilterContextProvider = <Item, ControlNames extends DefaultControlNames>({
  children,
  entityID,
  matchFunctions,
  saveToLocalStorage = false,
}: FilterContextProviderProps<Item, ControlNames>) => {
  const LS_FILTER_ENTITY_KEY = `${LS_FILTER_KEY}_${entityID}`;
  const lsFilterState = LOCAL_STORAGE_SERVICE.getItem(LS_FILTER_ENTITY_KEY);

  const [filter, setFilter] = React.useState<FilterState<Item, ControlNames>>(() => {
    if (saveToLocalStorage && lsFilterState) {
      return {
        ...lsFilterState,
        matchFunctions: {
          ...defaultInitialFilterState.matchFunctions,
          ...matchFunctions,
        },
      };
    }

    return {
      ...defaultInitialFilterState,
      matchFunctions: {
        ...defaultInitialFilterState.matchFunctions,
        ...matchFunctions,
      },
    };
  });

  const [showFilter, setShowFilter] = React.useState<boolean>(lsFilterState ?? false);

  const filterFunction = React.useCallback(
    (item: Item) => {
      let matches = true;

      for (const [key, filterFn] of Object.entries(filter.matchFunctions)) {
        const keyControlValue = filter.values[key as ControlNames];

        matches = keyControlValue ? filterFn(item, keyControlValue) : true;

        if (!matches) {
          break;
        }
      }

      return matches;
    },
    [filter]
  );

  const setFilterItem = React.useCallback(
    (key: string, value: string | string[]) => {
      setFilter((prev) => {
        const newFilters = {
          ...prev,
          values: {
            ...prev.values,
            [key]: value,
          },
        };

        if (saveToLocalStorage) {
          LOCAL_STORAGE_SERVICE.setItem(LS_FILTER_ENTITY_KEY, {
            // setting only values to local storage
            values: newFilters.values,
          });
        }

        return newFilters;
      });
    },
    [LS_FILTER_ENTITY_KEY, saveToLocalStorage]
  );

  const resetFilter = React.useCallback(() => {
    setFilter(defaultInitialFilterState as FilterState<Item, ControlNames>);

    if (saveToLocalStorage) {
      LOCAL_STORAGE_SERVICE.removeItem(LS_FILTER_ENTITY_KEY);
    }
  }, [LS_FILTER_ENTITY_KEY, saveToLocalStorage]);

  return (
    <FilterContext.Provider value={{ showFilter, filter, setFilterItem, setShowFilter, resetFilter, filterFunction }}>
      {children}
    </FilterContext.Provider>
  );
};
