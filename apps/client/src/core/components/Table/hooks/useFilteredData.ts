import React from "react";

export interface UseDataProps<DataType> {
  data: DataType[];
  comparator: (a: DataType, b: DataType) => number;
  filterFunction?: (el: DataType) => boolean;
  isLoading: boolean;
  error: unknown;
}

export const useFilteredData = <DataType>({
  data,
  filterFunction,
  comparator,
  isLoading,
  error,
}: UseDataProps<DataType>) => {
  return React.useMemo(() => {
    if (!data || isLoading || error) {
      return null;
    }

    let result = [...data];

    if (filterFunction) {
      result = result.filter(filterFunction);
    }

    return result.sort(comparator);
  }, [data, isLoading, error, filterFunction, comparator]);
};
