import React from "react";

// Base filter control names that are available everywhere
export type BaseFilterControls = "search" | "namespace";

// Generic filter control names - can be extended by specific pages
export type FilterControlNames = BaseFilterControls | string;

// Filter value types
export type FilterValue = string | string[] | boolean;

// Filter function types
export type FilterFunction<Item> = (item: Item, value: FilterValue) => boolean;

// Type mapping for specific control values
export type FilterValueMap = Record<string, FilterValue>;

// Filter state for a specific entity with strict value types
export interface FilterState<
  Item,
  ControlNames extends string,
  ValueMap extends FilterValueMap = Record<ControlNames, FilterValue>,
> {
  values: {
    [K in ControlNames]: ValueMap[K];
  };
  matchFunctions: Record<ControlNames, FilterFunction<Item>>;
}

// Context provider value with strict value types
export interface FilterContextValue<
  Item,
  ControlNames extends string,
  ValueMap extends FilterValueMap = Record<ControlNames, FilterValue>,
> {
  showFilter: boolean;
  filter: FilterState<Item, ControlNames, ValueMap>;
  setFilterItem: <K extends ControlNames>(key: K, value: ValueMap[K]) => void;
  setShowFilter: React.Dispatch<React.SetStateAction<boolean>>;
  resetFilter: () => void;
  filterFunction: (item: Item) => boolean;
}

// Context provider props with strict value types
export interface FilterProviderProps<
  Item,
  ControlNames extends string,
  ValueMap extends FilterValueMap = Record<ControlNames, FilterValue>,
> {
  children: React.ReactNode;
  entityID: string;
  matchFunctions: Record<ControlNames, FilterFunction<Item>>;
  valueMap?: ValueMap;
  saveToLocalStorage?: boolean;
}

// Control component interface
export interface FilterControl {
  component: React.ReactElement;
  gridXs?: number;
}

// Filter controls object type
export type FilterControls<ControlNames extends string> = Record<ControlNames, FilterControl>;

// Filter component props
export interface FilterProps<ControlNames extends string> {
  controls: FilterControls<ControlNames>;
  hideFilter?: boolean;
}
