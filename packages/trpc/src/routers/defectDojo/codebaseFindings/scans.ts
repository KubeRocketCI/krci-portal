import { isCodebaseScanLevel, scanRefKey, type CodebaseScanRef } from "@my-project/shared";
import {
  DEFECTDOJO_LEVEL_SCAN_TYPES,
  toTagCase,
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

/** Tells an own image from a third-party one: an own image is one that a CodebaseImageStream of the codebase names. */
export function createOwnImageMatcher({ ownImageNames }: Pick<CodebaseFacts, "ownImageNames">) {
  const ownImages = new Set(ownImageNames.map(toTagCase));
  return (image: string | null): boolean => image !== null && ownImages.has(toTagCase(image));
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

/** A scan as its tests make it, before the facts of its codebase tell an own image. */
export type NewestScan = Omit<ScanEntry, "ownImage">;

/**
 * The scans of CI tests of one codebase. Only code and image tests of a branch are scans; tests of one branch, scanner
 * and image are one scan: the one uploaded last. An image tag without a value names no image.
 */
export function newestScans(tests: readonly DefectDojoTest[]): NewestScan[] {
  const newest = new Map<string, NewestScan>();
  for (const test of tests) {
    if (!isCodebaseScanLevel(test.level) || test.branchTag === "") {
      continue;
    }

    const image = test.level === "image" ? tagValue(test.tags, TAG_KEY.ociImage) || null : null;
    const scan: NewestScan = {
      ref: { level: test.level, branch: test.branchTag, scanner: test.scanType, image },
      testId: test.id,
      version: test.version,
      date: test.updated,
      testUrl: test.url,
      productUrl: test.product.url,
    };
    const key = scanRefKey(scan.ref);
    const kept = newest.get(key);
    if (!kept || isNewer(scan, kept)) {
      newest.set(key, scan);
    }
  }
  return [...newest.values()];
}

/** A scan whose image is not known to be the codebase's own (`null`) orders as a third-party one. */
type ScanOrder = Pick<ScanEntry, "ref"> & { ownImage: boolean | null };

/** Orders scans by branch, in the order of `branches`, then own image before third-party images, then image, then scanner. */
export function compareScans(branches: readonly string[]) {
  const scannerRank = ({ ref }: Pick<ScanEntry, "ref">) =>
    (DEFECTDOJO_LEVEL_SCAN_TYPES[ref.level] as readonly string[]).indexOf(ref.scanner);

  return (a: ScanOrder, b: ScanOrder): number =>
    branches.indexOf(a.ref.branch) - branches.indexOf(b.ref.branch) ||
    Number(b.ownImage) - Number(a.ownImage) ||
    (a.ref.image ?? "").localeCompare(b.ref.image ?? "") ||
    scannerRank(a) - scannerRank(b);
}

/**
 * The scans of a codebase from its CI tests: the scans of a branch that has a CodebaseBranch, the default branch
 * first, as `compareScans` orders them.
 */
export function buildScans(facts: CodebaseFacts, tests: readonly DefectDojoTest[]): ScanEntry[] {
  const isOwnImage = createOwnImageMatcher(facts);

  return newestScans(tests.filter((test) => facts.branches.includes(test.branchTag)))
    .map((scan) => ({ ...scan, ownImage: isOwnImage(scan.ref.image) }))
    .sort(compareScans(facts.branches));
}
