import { Code, Package, Server, type LucideIcon } from "lucide-react";
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

export const RUNTIME_META: LevelMeta = {
  label: "Runtime",
  icon: Server,
  subject: "Containers of the codebase that run in its Environments",
  findings: "Runtime findings",
};

/** What writes the Code and Image findings to DefectDojo. */
export const SCAN_PRODUCER = "CI security scan";

/** What writes the Runtime findings to DefectDojo. */
export const RUNTIME_PRODUCER = "security operator";

/** Said when the codebase has no Environment: by the Runtime section and by the running side of Built vs running. */
export const NO_ENVIRONMENT_HINT = "The codebase is not deployed to any Environment.";

export const CELL_CLASS = "px-3 py-2 align-middle";

/** Expand, scan, branch or Environment, image tag, a column per severity, triaged, last upload, link. */
export const COLUMN_COUNT = 7 + DEFECTDOJO_SEVERITIES.length;

export const NO_SCAN_DATA_MESSAGE = "DefectDojo holds no data for this scan any more.";

export const FINDINGS_PAGE_SIZES = [SCAN_FINDINGS_DEFAULT_PAGE_SIZE, 25, 50];
