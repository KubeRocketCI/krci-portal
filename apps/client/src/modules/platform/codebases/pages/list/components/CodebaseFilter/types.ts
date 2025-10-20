import { CODEBASE_LIST_FILTER_NAMES } from "./constants";

export type CodebaseListFilterValues = {
  [CODEBASE_LIST_FILTER_NAMES.SEARCH]: string;
  [CODEBASE_LIST_FILTER_NAMES.CODEBASE_TYPE]: string;
};
