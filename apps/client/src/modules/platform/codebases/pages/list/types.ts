import { Codebase } from "@my-project/shared";
import { codebaseListFilterControlNames } from "./constants";
import { ControlName } from "@/core/providers/Filter/types";
import { ValueOf } from "@/core/types/global";

export type ComponentListFilterControlNames = ValueOf<typeof codebaseListFilterControlNames>;

export type ComponentListFilterAllControlNames = ControlName<ComponentListFilterControlNames>;

export type MatchFunctions = {
  [key in ComponentListFilterAllControlNames]?: (item: Codebase, value: string | string[]) => boolean;
};
