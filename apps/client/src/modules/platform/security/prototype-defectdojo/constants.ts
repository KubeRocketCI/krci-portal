// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
import { Code, Package, Server, type LucideIcon } from "lucide-react";
import type { PrototypeDefectDojoLevel, PrototypeDefectDojoSeverity } from "@my-project/shared";

export interface PrototypeLevelMeta {
  label: string;
  icon: LucideIcon;
  /** The component that writes the level's findings to DefectDojo. */
  producer: string;
  subject: string;
}

export const PROTOTYPE_LEVEL_META: Record<PrototypeDefectDojoLevel, PrototypeLevelMeta> = {
  code: {
    label: "Code",
    icon: Code,
    producer: "CI security pipeline",
    subject: "Source code of a branch: SAST and secret detection",
  },
  image: {
    label: "Image",
    icon: Package,
    producer: "CI security pipeline",
    subject: "Container images built from a branch and the images of its chart",
  },
  runtime: {
    label: "Runtime",
    icon: Server,
    producer: "security operator",
    subject: "Workloads running in an Environment",
  },
};

export const PROTOTYPE_SEVERITY_KEYS: {
  severity: PrototypeDefectDojoSeverity;
  key: "critical" | "high" | "medium" | "low" | "info";
  short: string;
}[] = [
  { severity: "Critical", key: "critical", short: "C" },
  { severity: "High", key: "high", short: "H" },
  { severity: "Medium", key: "medium", short: "M" },
  { severity: "Low", key: "low", short: "L" },
  { severity: "Info", key: "info", short: "I" },
];

export const PROTOTYPE_NO_VALUE = "—";
