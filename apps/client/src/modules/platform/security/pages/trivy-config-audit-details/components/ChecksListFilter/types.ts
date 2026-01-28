import { CHECKS_LIST_FILTER_NAMES } from "./constants";

export type ChecksListFilterValues = {
  [CHECKS_LIST_FILTER_NAMES.SEVERITY]: string;
  [CHECKS_LIST_FILTER_NAMES.STATUS]: string;
};
