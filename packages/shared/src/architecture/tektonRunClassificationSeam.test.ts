import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Tekton run classification seam.
 * Files under `apps/client/src` and `packages/trpc/src` that mention PipelineRun or TaskRun
 * must not read `conditions[0]`, `conditions.at(0)`, or compare a condition `type` to "Succeeded".
 * Use getPipelineRunStatus().phase or getTaskRunStatus().phase.
 */

const CLASSIFICATION_PATTERN = /conditions\??\.\[0\]|conditions\[0\]|conditions\??\.at\(0\)|type === ["']Succeeded["']/;

const SCAN_ROOTS = ["apps/client/src", "packages/trpc/src"];

const SKIP_DIRS = new Set(["node_modules", "dist"]);

const RESOURCE_GATE = /pipelinerun|taskrun/i;

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

      const content = readFileSync(file, "utf8");
      if (!RESOURCE_GATE.test(content)) continue;

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

describe("Tekton run classification seam", () => {
  it("classifies Tekton runs only through their phase classifier", () => {
    const hits = findClassificationHits();
    const message = [
      ...hits.map((hit) => `${hit.path}:${hit.line}: ${hit.text}`),
      "Classify runs through getPipelineRunStatus().phase or getTaskRunStatus().phase",
    ].join("\n");

    expect(hits, message).toEqual([]);
  });
});
