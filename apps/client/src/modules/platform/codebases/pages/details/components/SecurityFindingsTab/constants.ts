import { Code, Package, type LucideIcon } from "lucide-react";
import { DEFECTDOJO_SEVERITIES, SCAN_FINDINGS_DEFAULT_PAGE_SIZE, type CodebaseScanLevel } from "@my-project/shared";

export interface LevelMeta {
  label: string;
  icon: LucideIcon;
  /** What the scans of the level look at. */
  subject: string;
  /** What a level without scans lacks. */
  findings: string;
}

export const LEVEL_META: Record<CodebaseScanLevel, LevelMeta> = {
  code: {
    label: "Code",
    icon: Code,
    subject: "Source code of a branch: SAST and secret detection",
    findings: "Code findings",
  },
  image: {
    label: "Image",
    icon: Package,
    subject: "Container images built from a branch and the images of its chart",
    findings: "Image findings",
  },
};

/** What writes the Code and Image findings to DefectDojo. */
export const SCAN_PRODUCER = "CI security scan";

/** Expand, scan, branch, image tag, a column per severity, triaged, last upload, link. */
export const COLUMN_COUNT = 7 + DEFECTDOJO_SEVERITIES.length;

export const FINDINGS_PAGE_SIZES = [SCAN_FINDINGS_DEFAULT_PAGE_SIZE, 25, 50];
