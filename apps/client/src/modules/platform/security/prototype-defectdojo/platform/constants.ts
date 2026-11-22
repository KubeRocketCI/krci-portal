// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
import type { PrototypeVariant } from "../components/PrototypeVariantSwitcher";
import type { SecurityOverviewVariantKey } from "./types";

/** Three variants of the Security overview on DefectDojo, switched by `?variant=` on the overview route. */
export const SECURITY_OVERVIEW_VARIANTS: PrototypeVariant<SecurityOverviewVariantKey>[] = [
  { key: "A", name: "Dashboard" },
  { key: "B", name: "Inventory" },
  { key: "C", name: "Worklist" },
];

/** The Vulnerability Reports and Exposed Secrets pages have one DefectDojo layout each. */
export const SECURITY_LIST_VARIANTS: PrototypeVariant<"A">[] = [{ key: "A", name: "DefectDojo list" }];
