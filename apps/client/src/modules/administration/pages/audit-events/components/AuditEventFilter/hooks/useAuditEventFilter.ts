import { useFilterContext } from "@/core/providers/Filter";
import { useStore } from "@tanstack/react-form";
import { useDebouncedValue } from "@/core/hooks/useDebouncedValue";
import type { KrciAuditEvent } from "@my-project/shared";
import type { AuditEventListFilterValues } from "../types";

export const useAuditEventFilter = () => useFilterContext<KrciAuditEvent, AuditEventListFilterValues>();

export const useDebouncedAuditEventFilterValues = (): AuditEventListFilterValues => {
  const { form } = useAuditEventFilter();
  const values = useStore(form.store, (state) => state.values);
  return useDebouncedValue(values, 300);
};
