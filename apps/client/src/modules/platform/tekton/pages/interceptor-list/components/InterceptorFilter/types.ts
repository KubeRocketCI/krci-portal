import { INTERCEPTOR_LIST_FILTER_NAMES } from "./constants";

export type InterceptorListFilterValues = {
  [INTERCEPTOR_LIST_FILTER_NAMES.SEARCH]: string;
  [INTERCEPTOR_LIST_FILTER_NAMES.NAMESPACES]: string[];
};
