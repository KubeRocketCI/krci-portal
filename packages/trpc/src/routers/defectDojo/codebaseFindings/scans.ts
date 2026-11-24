import { CODEBASE_SCAN_LEVELS, scanRefKey, type CodebaseScanLevel, type CodebaseScanRef } from "@my-project/shared";
import {
  DEFECTDOJO_LEVEL_SCAN_TYPES,
  type DefectDojoLevel,
  type DefectDojoScanType,
  type DefectDojoTest,
  type DefectDojoTestsFilter,
} from "../../../clients/defectDojo/index.js";
import type { CodebaseFacts } from "./facts.js";
import { TAG_KEY, formatTag, tagValue } from "./tags.js";

/** Tags that select the CI tests of a codebase: its name and the namespace of its Codebase object. */
export function ciTestTags({ name, namespace }: Pick<CodebaseFacts, "name" | "namespace">): string[] {
  return [formatTag(TAG_KEY.codebase, name), formatTag(TAG_KEY.tenant, namespace)];
}

/**
 * Tells an own image from a third-party one: an own image is one that a CodebaseImageStream of the codebase names.
 * DefectDojo lower-cases tags, so the comparison ignores case.
 */
export function createOwnImageMatcher({ ownImageNames }: Pick<CodebaseFacts, "ownImageNames">) {
  const ownImages = new Set(ownImageNames.map((imageName) => imageName.toLowerCase()));
  return (image: string | null): boolean => image !== null && ownImages.has(image.toLowerCase());
}

/** One scan of the codebase: the typed identity the browser sees, and the test it resolves to. */
export interface ScanEntry {
  ref: CodebaseScanRef;
  testId: number;
  ownImage: boolean;
  version: string;
  date: string;
  testUrl: string;
  productUrl: string;
}

function isCodebaseScanLevel(level: DefectDojoLevel | null): level is CodebaseScanLevel {
  return CODEBASE_SCAN_LEVELS.some((codebaseScanLevel) => codebaseScanLevel === level);
}

/** The scan type a scan names, or `null` when the scanner is none of its level. */
function scanTypeOf(scan: CodebaseScanRef): DefectDojoScanType | null {
  const scanTypes: readonly DefectDojoScanType[] = DEFECTDOJO_LEVEL_SCAN_TYPES[scan.level];
  return scanTypes.find((scanType) => scanType === scan.scanner) ?? null;
}

/**
 * Selects the tests a scan can be: those of its branch, scanner and image. `null`: no test can be that scan.
 */
export function scanTestsFilter(
  facts: Pick<CodebaseFacts, "name" | "namespace">,
  scan: CodebaseScanRef
): DefectDojoTestsFilter | null {
  const scanType = scanTypeOf(scan);
  if (scanType === null) {
    return null;
  }

  return {
    tags: [...ciTestTags(facts), ...(scan.image === null ? [] : [formatTag(TAG_KEY.ociImage, scan.image)])],
    branchTag: scan.branch,
    scanType,
  };
}

/** The candidate was uploaded after the kept one: a later date, and between equal dates the later test. */
export function isNewer(
  candidate: Pick<ScanEntry, "date" | "testId">,
  kept: Pick<ScanEntry, "date" | "testId">
): boolean {
  const byDate = Date.parse(candidate.date) - Date.parse(kept.date);
  return byDate !== 0 ? byDate > 0 : candidate.testId > kept.testId;
}

export function latestDate(dates: readonly string[]): string | null {
  return dates.reduce<string | null>(
    (latest, date) => (latest === null || Date.parse(date) > Date.parse(latest) ? date : latest),
    null
  );
}

/**
 * The scans of a codebase from its CI tests. Only code and image scans of a branch that has a CodebaseBranch are
 * scans. Tests of one branch, scanner and image are one scan: the one uploaded last. Ordered by branch (the default
 * branch first), then own image before third-party images, then image, then scanner.
 */
export function buildScans(facts: CodebaseFacts, tests: readonly DefectDojoTest[]): ScanEntry[] {
  const isOwnImage = createOwnImageMatcher(facts);

  const entries = tests.flatMap((test): ScanEntry[] => {
    if (!isCodebaseScanLevel(test.level) || !facts.branches.includes(test.branchTag)) {
      return [];
    }

    const image = test.level === "image" ? tagValue(test.tags, TAG_KEY.ociImage) : null;
    return [
      {
        ref: { level: test.level, branch: test.branchTag, scanner: test.scanType, image },
        testId: test.id,
        ownImage: isOwnImage(image),
        version: test.version,
        date: test.updated,
        testUrl: test.url,
        productUrl: test.product.url,
      },
    ];
  });

  const newest = new Map<string, ScanEntry>();
  for (const entry of entries) {
    const key = scanRefKey(entry.ref);
    const kept = newest.get(key);
    if (!kept || isNewer(entry, kept)) {
      newest.set(key, entry);
    }
  }

  const scannerRank = ({ ref }: ScanEntry) =>
    (DEFECTDOJO_LEVEL_SCAN_TYPES[ref.level] as readonly string[]).indexOf(ref.scanner);

  return [...newest.values()].sort(
    (a, b) =>
      facts.branches.indexOf(a.ref.branch) - facts.branches.indexOf(b.ref.branch) ||
      Number(b.ownImage) - Number(a.ownImage) ||
      (a.ref.image ?? "").localeCompare(b.ref.image ?? "") ||
      scannerRank(a) - scannerRank(b)
  );
}
