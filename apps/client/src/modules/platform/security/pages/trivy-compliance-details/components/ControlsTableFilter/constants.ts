import { MatchFunctions } from "@/core/providers/Filter";
import { ControlTableRow } from "../../types";
import { ControlsTableFilterValues } from "./types";

export const CONTROLS_TABLE_FILTER_NAMES = {
  SEVERITY: "severity",
  STATUS: "status",
} as const;

export const controlsTableFilterDefaultValues: ControlsTableFilterValues = {
  [CONTROLS_TABLE_FILTER_NAMES.SEVERITY]: "all",
  [CONTROLS_TABLE_FILTER_NAMES.STATUS]: "all",
};

export const matchFunctions: MatchFunctions<ControlTableRow, ControlsTableFilterValues> = {
  [CONTROLS_TABLE_FILTER_NAMES.SEVERITY]: (item, value) => {
    if (value === "all") {
      return true;
    }
    return item.severity?.toLowerCase() === value;
  },
  [CONTROLS_TABLE_FILTER_NAMES.STATUS]: (item, value) => {
    if (value === "all") {
      return true;
    }
    if (value === "pass") {
      return item.passed;
    }
    if (value === "fail") {
      return !item.passed;
    }
    return true;
  },
};
