import React from "react";
import { ValueOf } from "@/core/types/global";
import { DEFAULT_CONTROLS } from "./constants";

export type DefaultControlNames = ValueOf<typeof DEFAULT_CONTROLS>;

export type ControlName<ControlNames> = DefaultControlNames | ControlNames;

export type ControlValue = boolean | ControlComponent;

export type FilterState<Item, ControlNames extends string> = {
  values: Record<ControlName<ControlNames>, string | string[] | boolean>;
  matchFunctions: Record<ControlName<ControlNames>, (item: Item, value: unknown) => boolean>;
};

export interface FilterContextProviderValue<Item, ControlNames extends string> {
  showFilter: boolean;
  filter: FilterState<Item, ControlNames>;
  setFilterItem: (key: ControlNames, value: unknown) => void;
  setShowFilter: React.Dispatch<React.SetStateAction<boolean>>;
  resetFilter: () => void;
  filterFunction: (item: Item) => boolean;
}

export interface FilterContextProviderProps<Item, ControlNames extends string> {
  children: React.ReactNode;
  entityID: string;
  matchFunctions:
    | {
        [key in ControlNames]?: (item: Item, value: unknown) => boolean;
      }
    | null;
  saveToLocalStorage?: boolean;
}

export interface ControlComponent {
  component: React.ReactElement;
  gridXs?: number;
}
