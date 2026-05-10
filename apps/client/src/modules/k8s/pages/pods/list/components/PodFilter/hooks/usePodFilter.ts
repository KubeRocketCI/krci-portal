import { useFilterContext } from "@/core/providers/Filter";
import { useStore } from "@tanstack/react-form";
import { useDebouncedValue } from "@/core/hooks/useDebouncedValue";
import type { Pod } from "@my-project/shared";
import type { PodListFilterValues } from "../types";

export const usePodFilter = () => useFilterContext<Pod, PodListFilterValues>();

export const useDebouncedPodSearch = () => {
  const { form } = usePodFilter();
  const searchTerm = useStore(form.store, (state) => state.values.search);
  return useDebouncedValue(searchTerm, 300);
};
