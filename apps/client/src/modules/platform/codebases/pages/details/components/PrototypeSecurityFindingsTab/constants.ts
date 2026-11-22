// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
import type { PrototypeVariant } from "@/modules/platform/security/prototype-defectdojo/components/PrototypeVariantSwitcher";
import type { CodebaseFindingsVariantKey } from "./types";

/** Three variants of the Security Findings tab, switched by `?variant=` on the codebase details route. */
export const CODEBASE_FINDINGS_VARIANTS: PrototypeVariant<CodebaseFindingsVariantKey>[] = [
  { key: "A", name: "Level lanes" },
  { key: "B", name: "Built vs running" },
  { key: "C", name: "Coverage matrix" },
];

export const DEFAULT_CODEBASE_FINDINGS_VARIANT: CodebaseFindingsVariantKey = "A";
