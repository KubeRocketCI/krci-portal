import { DEFECTDOJO_SEVERITIES, SCAN_FINDINGS_DEFAULT_PAGE_SIZE } from "@my-project/shared";

/** Said when the codebase has no Environment: by the Runtime section and by the running side of Built vs running. */
export const NO_ENVIRONMENT_HINT = "The codebase is not deployed to any Environment.";

/** Expand, scan, branch or Environment, image tag, a column per severity, triaged, last upload, link. */
export const COLUMN_COUNT = 7 + DEFECTDOJO_SEVERITIES.length;

export const NO_SCAN_DATA_MESSAGE = "DefectDojo holds no data for this scan any more.";

export const FINDINGS_PAGE_SIZES = [SCAN_FINDINGS_DEFAULT_PAGE_SIZE, 25, 50];
