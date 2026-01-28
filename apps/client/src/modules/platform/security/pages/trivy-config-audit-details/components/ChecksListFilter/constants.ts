import { MatchFunctions } from "@/core/providers/Filter";
import { AuditCheckWithId } from "../../types";
import { ChecksListFilterValues } from "./types";

export const CHECKS_LIST_FILTER_NAMES = {
  SEVERITY: "severity",
  STATUS: "status",
} as const;

export const checksListFilterDefaultValues: ChecksListFilterValues = {
  [CHECKS_LIST_FILTER_NAMES.SEVERITY]: "all",
  [CHECKS_LIST_FILTER_NAMES.STATUS]: "all",
};

export const matchFunctions: MatchFunctions<AuditCheckWithId, ChecksListFilterValues> = {
  [CHECKS_LIST_FILTER_NAMES.SEVERITY]: (item, value) => {
    if (value === "all") {
      return true;
    }
    return item.severity?.toLowerCase() === value;
  },
  [CHECKS_LIST_FILTER_NAMES.STATUS]: (item, value) => {
    if (value === "all") {
      return true;
    }
    if (value === "pass") {
      return item.success;
    }
    if (value === "fail") {
      return !item.success;
    }
    return true;
  },
};
