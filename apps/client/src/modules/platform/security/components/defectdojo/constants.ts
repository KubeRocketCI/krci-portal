import type { DefectDojoFindingState, DefectDojoLevel } from "@my-project/shared";
import { Code, Package, Server, type LucideIcon } from "lucide-react";

/** Shown in place of a value that does not exist. A count that is missing is never shown as 0. */
export const NO_VALUE = "—";

/** Header cell of the tables of scans and findings. */
export const HEAD_CLASS = "bg-muted text-muted-foreground px-3 py-2 text-xs font-medium";

export interface LevelMeta {
  label: string;
  icon: LucideIcon;
  subject: string;
  /** `NoScanDataState` reads "The {producer} has not reported {findings} for …". */
  producer: string;
  findings: string;
}

const SCAN_PRODUCER = "CI security scan";

export const LEVEL_META: Record<DefectDojoLevel, LevelMeta> = {
  code: {
    label: "Code",
    icon: Code,
    subject: "Source code of a branch: SAST and secret detection",
    producer: SCAN_PRODUCER,
    findings: "Code findings",
  },
  image: {
    label: "Image",
    icon: Package,
    subject: "Container images built from a branch and the images of its chart",
    producer: SCAN_PRODUCER,
    findings: "Image findings",
  },
  runtime: {
    label: "Runtime",
    icon: Server,
    subject: "Containers of the codebase that run in its Environments",
    producer: "security operator",
    findings: "Runtime findings",
  },
};

export const FINDING_STATE_LABELS: Record<DefectDojoFindingState, string> = {
  active: "Active",
  mitigated: "Mitigated",
  falsePositive: "False positive",
  outOfScope: "Out of scope",
  riskAccepted: "Risk accepted",
};
