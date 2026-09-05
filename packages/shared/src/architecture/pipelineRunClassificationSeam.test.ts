import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Enforces the PipelineRun classification seam.
 * `apps/client/src` and `packages/trpc/src` must derive a run's state through
 * `getPipelineRunStatus().phase`, not by reading `conditions[0]`/`conditions.at(0)`
 * or comparing a condition's `type` to `"Succeeded"` directly. New hits fail the
 * build; `ALLOWLIST` exists for pre-existing exceptions only.
 *
 * The guard only scans files that mention `PipelineRun`; other resources'
 * conditions (Pod, TaskRun standalone views, etc.) are out of scope.
 */

const CLASSIFICATION_PATTERN = /conditions\??\.\[0\]|conditions\[0\]|conditions\??\.at\(0\)|type === ["']Succeeded["']/;

const SCAN_ROOTS = ["apps/client/src", "packages/trpc/src"];

const SKIP_DIRS = new Set(["node_modules", "dist"]);

/** File gate token. Only files whose content contains this are scanned. */
const RESOURCE_GATE = "PipelineRun";

/** Files that read TaskRun conditions inside PipelineRun views. */
const ALLOWLIST: ReadonlyArray<{ path: string; reason: string }> = [
  {
    path: "apps/client/src/modules/platform/tekton/components/PipelineRunDiagram/components/PipelineRunTaskNode.tsx",
    reason:
      "TaskRun has no phase classifier yet (see getPipelineRunStatus for PipelineRun); remove once TaskRun gets the same seam.",
  },
  {
    path: "apps/client/src/modules/platform/tekton/pages/pipelinerun-details/components/Details/index.tsx",
    reason:
      "TaskRun has no phase classifier yet (see getPipelineRunStatus for PipelineRun); remove once TaskRun gets the same seam.",
  },
];

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

function isScannableFile(fileName: string): boolean {
  if (!/\.tsx?$/.test(fileName)) return false;
  if (/\.test\.tsx?$/.test(fileName)) return false;
  if (fileName.endsWith(".stories.tsx")) return false;
  return true;
}

function listSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      files.push(...listSourceFiles(path.join(dir, entry.name)));
      continue;
    }

    if (isScannableFile(entry.name)) {
      files.push(path.join(dir, entry.name));
    }
  }

  return files;
}

interface Hit {
  path: string;
  line: number;
  text: string;
}

function toRepoRelativePath(absolutePath: string): string {
  return path.relative(repoRoot, absolutePath).split(path.sep).join("/");
}

function isCommentLine(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*");
}

function findClassificationHits(): Hit[] {
  const hits: Hit[] = [];

  for (const root of SCAN_ROOTS) {
    for (const file of listSourceFiles(path.join(repoRoot, root))) {
      const relPath = toRepoRelativePath(file);
      if (ALLOWLIST.some((entry) => entry.path === relPath)) continue;

      const content = readFileSync(file, "utf8");
      if (!content.includes(RESOURCE_GATE)) continue;

      const lines = content.split("\n");
      lines.forEach((line, index) => {
        if (isCommentLine(line)) return;
        if (CLASSIFICATION_PATTERN.test(line)) {
          hits.push({ path: relPath, line: index + 1, text: line.trim() });
        }
      });
    }
  }

  return hits;
}

describe("PipelineRun classification seam", () => {
  it("classifies PipelineRuns only through getPipelineRunStatus", () => {
    const hits = findClassificationHits();
    const message = [
      ...hits.map((hit) => `${hit.path}:${hit.line}: ${hit.text}`),
      "Classify PipelineRuns through getPipelineRunStatus().phase",
    ].join("\n");

    expect(hits, message).toEqual([]);
  });
});
