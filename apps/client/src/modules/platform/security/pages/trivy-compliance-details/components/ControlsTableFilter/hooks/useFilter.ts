import { useFilterContext } from "@/core/providers/Filter";
import { ControlTableRow } from "../../../types";
import { ControlsTableFilterValues } from "../types";

export const useControlsTableFilter = () => useFilterContext<ControlTableRow, ControlsTableFilterValues>();
