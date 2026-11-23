import { CODEBASE_SCAN_LEVELS, scanRefKey, type CodebaseScanLevel, type CodebaseScanRef } from "@my-project/shared";
import {
  DEFECTDOJO_LEVEL_SCAN_TYPES,
  type DefectDojoLevel,
  type DefectDojoScanType,
  type DefectDojoTest,
  type DefectDojoTestsFilter,
} from "../../../clients/defectDojo/index.js";
import type { CodebaseFacts } from "./facts.js";

/** Keys of the tags the CI security scan writes on its tests. */
const TAG_KEY = {
  codebase: "app.edp.epam.com/codebase",
  tenant: "app.edp.epam.com/tenant",
  ociImage: "oci-image",
} as const;

/** Tags that select the CI tests of a codebase: its name and the namespace of its Codebase object. */
export function ciTestTags({ name, namespace }: Pick<CodebaseFacts, "name" | "namespace">): string[] {
  return [`${TAG_KEY.codebase}:${name}`, `${TAG_KEY.tenant}:${namespace}`];
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
    tags: [...ciTestTags(facts), ...(scan.image === null ? [] : [`${TAG_KEY.ociImage}:${scan.image}`])],
    branchTag: scan.branch,
    scanType,
  };
}

/** Value of the tag `<key>:<value>`, or `null` when the test has no tag of that key. */
function tagValue(tags: readonly string[], key: string): string | null {
  const prefix = `${key}:`;
  const tag = tags.find((candidate) => candidate.startsWith(prefix));
  return tag === undefined ? null : tag.slice(prefix.length);
}

/** The scan was uploaded after the kept one: a later date, and between equal dates the later test. */
function isNewer(candidate: ScanEntry, kept: ScanEntry): boolean {
  const byDate = Date.parse(candidate.date) - Date.parse(kept.date);
  return byDate !== 0 ? byDate > 0 : candidate.testId > kept.testId;
}

/**
 * The scans of a codebase from its CI tests. Only code and image scans of a branch that has a CodebaseBranch are
 * scans; an own image is one that a CodebaseImageStream of the codebase names. Tests of one branch, scanner and
 * image are one scan: the one uploaded last. Ordered by branch (the default branch first), then own image before
 * third-party images, then image, then scanner.
 */
export function buildScans(facts: CodebaseFacts, tests: readonly DefectDojoTest[]): ScanEntry[] {
  const ownImages = new Set(facts.ownImageNames.map((imageName) => imageName.toLowerCase()));

  const entries = tests.flatMap((test): ScanEntry[] => {
    if (!isCodebaseScanLevel(test.level) || !facts.branches.includes(test.branchTag)) {
      return [];
    }

    const image = test.level === "image" ? tagValue(test.tags, TAG_KEY.ociImage) : null;
    return [
      {
        ref: { level: test.level, branch: test.branchTag, scanner: test.scanType, image },
        testId: test.id,
        ownImage: image !== null && ownImages.has(image.toLowerCase()),
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
