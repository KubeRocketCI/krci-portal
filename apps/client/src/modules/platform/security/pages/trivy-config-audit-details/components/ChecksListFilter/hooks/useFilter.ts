import { useFilterContext } from "@/core/providers/Filter";
import { AuditCheckWithId } from "../../../types";
import { ChecksListFilterValues } from "../types";

export const useChecksListFilter = () => useFilterContext<AuditCheckWithId, ChecksListFilterValues>();
