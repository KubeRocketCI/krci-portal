import { readdirSync, readFileSync } from "node:fs";
import { join, sep } from "node:path";
import { describe, expect, it } from "vitest";

const SRC_DIR = join(__dirname, "..", "..", "..", "..");
const TAG_END = /(?<!=)>/;
const DESCRIBEDBY_PROP = /aria-describedby=|"aria-describedby":/;

interface Overlay {
  content: string;
  root: RegExp;
  description: RegExp;
}

const OVERLAYS: Overlay[] = [
  { content: "DialogContent", root: /<Dialog[\s>]/g, description: /(?<!(?:&&|\?|:)\s*)<DialogDescription\b/ },
  { content: "SheetContent", root: /<Sheet[\s>]/g, description: /(?<!(?:&&|\?|:)\s*)<SheetDescription\b/ },
];

function listSourceFiles(): string[] {
  return readdirSync(SRC_DIR, { recursive: true, encoding: "utf8" })
    .filter((path) => path.endsWith(".tsx") && !path.endsWith(".test.tsx"))
    .filter((path) => !path.split(sep).includes("node_modules"));
}

function lastIndexBefore(pattern: RegExp, source: string, limit: number): number {
  let found = -1;
  for (const match of source.matchAll(pattern)) {
    if (match.index >= limit) break;
    found = match.index;
  }
  return found;
}

// A content element is described by an aria-describedby prop on its own opening tag, or by an unconditional
// description element between its enclosing root and its closing tag. FormGuideDialogContent sets aria-describedby itself.
function findUndescribedContents(source: string, overlay: Overlay): number[] {
  const lines: number[] = [];
  for (const match of source.matchAll(new RegExp(`<${overlay.content}\\b`, "g"))) {
    const tagEnd = source.slice(match.index).search(TAG_END);
    const openingTag = source.slice(match.index, tagEnd === -1 ? source.length : match.index + tagEnd);
    const closing = source.indexOf(`</${overlay.content}>`, match.index);
    const scopeStart = lastIndexBefore(overlay.root, source, match.index);
    const scope = scopeStart === -1 ? "" : source.slice(scopeStart, closing === -1 ? source.length : closing);
    if (!DESCRIBEDBY_PROP.test(openingTag) && !overlay.description.test(scope)) {
      lines.push(source.slice(0, match.index).split("\n").length);
    }
  }
  return lines;
}

describe("DialogContent and SheetContent accessible description", () => {
  it("is declared by every content element in the client source, stories included", () => {
    const offenders = listSourceFiles().flatMap((file) => {
      const source = readFileSync(join(SRC_DIR, file), "utf8");
      return OVERLAYS.flatMap((overlay) =>
        findUndescribedContents(source, overlay).map((line) => `${file}:${line} <${overlay.content}>`)
      );
    });

    expect(offenders).toEqual([]);
  });
});
