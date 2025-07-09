import { KubeObjectBase } from "@my-project/shared";
import React from "react";
import { LOCAL_STORAGE_SERVICE } from "../../services/local-storage";
import { namespaceFunction, searchFunction } from "./constants";
import { FilterContext } from "./context";
import { FilterContextValue, FilterProviderProps, FilterState, FilterValue, FilterValueMap } from "./types";

const LS_FILTER_KEY = "FILTER_STATE";

const createDefaultFilterState = <
  Item extends KubeObjectBase,
  ControlNames extends string,
  ValueMap extends FilterValueMap,
>(
  matchFunctions: Record<ControlNames, (item: Item, value: FilterValue) => boolean>,
  valueMap?: ValueMap
): FilterState<Item, ControlNames, ValueMap> => {
  const defaultValues: Record<string, FilterValue> = {};
  const defaultMatchFunctions: Record<string, (item: Item, value: FilterValue) => boolean> = {};

  if ("search" in matchFunctions) {
    defaultValues.search = "";
    defaultMatchFunctions.search = searchFunction;
  }

  if ("namespace" in matchFunctions) {
    defaultValues.namespace = "";
    defaultMatchFunctions.namespace = namespaceFunction;
  }

  Object.entries(matchFunctions).forEach(([key, fn]) => {
    if (!defaultValues[key]) {
      defaultValues[key] = "";
    }
    defaultMatchFunctions[key] = fn as (item: Item, value: FilterValue) => boolean;
  });

  const finalValues = valueMap ? { ...defaultValues, ...valueMap } : defaultValues;

  return {
    values: finalValues as {
      [K in ControlNames]: ValueMap[K];
    },
    matchFunctions: defaultMatchFunctions as Record<ControlNames, (item: Item, value: FilterValue) => boolean>,
  };
};

export const FilterProvider = <
  Item extends KubeObjectBase,
  ControlNames extends string,
  ValueMap extends FilterValueMap = Record<ControlNames, FilterValue>,
>({
  children,
  entityID,
  matchFunctions,
  valueMap,
  saveToLocalStorage = false,
}: FilterProviderProps<Item, ControlNames, ValueMap>) => {
  const LS_FILTER_ENTITY_KEY = `${LS_FILTER_KEY}_${entityID}`;
  const lsFilterState = LOCAL_STORAGE_SERVICE.getItem(LS_FILTER_ENTITY_KEY);

  const defaultState = createDefaultFilterState<Item, ControlNames, ValueMap>(matchFunctions, valueMap);

  const [filter, setFilter] = React.useState<FilterState<Item, ControlNames, ValueMap>>(() => {
    if (saveToLocalStorage && lsFilterState) {
      return {
        ...defaultState,
        values: {
          ...defaultState.values,
          ...lsFilterState.values,
        },
      };
    }

    return defaultState;
  });

  const [showFilter, setShowFilter] = React.useState<boolean>(lsFilterState?.showFilter ?? false);

  const filterFunction = React.useCallback(
    (item: Item) => {
      let matches = true;

      for (const [key, filterFn] of Object.entries(filter.matchFunctions)) {
        const keyControlValue = filter.values[key as ControlNames];

        matches = keyControlValue
          ? (filterFn as (item: Item, value: FilterValue) => boolean)(item, keyControlValue)
          : true;

        if (!matches) {
          break;
        }
      }

      return matches;
    },
    [filter]
  );

  const setFilterItem = React.useCallback(
    <K extends ControlNames>(key: K, value: ValueMap[K]) => {
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
            values: newFilters.values,
            showFilter,
          });
        }

        return newFilters;
      });
    },
    [LS_FILTER_ENTITY_KEY, saveToLocalStorage, showFilter]
  );

  const resetFilter = React.useCallback(() => {
    setFilter(defaultState);

    if (saveToLocalStorage) {
      LOCAL_STORAGE_SERVICE.removeItem(LS_FILTER_ENTITY_KEY);
    }
  }, [defaultState, LS_FILTER_ENTITY_KEY, saveToLocalStorage]);

  const contextValue: FilterContextValue<Item, ControlNames, ValueMap> = {
    showFilter,
    filter,
    setFilterItem,
    setShowFilter,
    resetFilter,
    filterFunction,
  };

  return (
    <FilterContext.Provider
      value={contextValue as unknown as FilterContextValue<unknown, string, Record<string, FilterValue>>}
    >
      {children}
    </FilterContext.Provider>
  );
};
