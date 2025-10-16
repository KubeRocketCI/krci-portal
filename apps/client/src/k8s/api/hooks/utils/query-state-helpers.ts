import { UseQueryResult } from "@tanstack/react-query";

/**
 * Extracts common loading/ready states from a query
 */
export const getQueryState = <TData, TError>(query: UseQueryResult<TData, TError>) => ({
  isReady: query.status === "success" || query.status === "error",
  isInitialLoading: !query.isFetched && query.isFetching,
});

/**
 * Converts Map to array of values
 */
export const mapToArray = <T>(map: Map<string, T> | undefined): T[] => {
  if (!map) return [];
  return Array.from(map.values());
};
