import { describe, expect, it } from "vitest";
import type { Pipeline, PipelineRun, PipelineRunDraft } from "@my-project/shared";
import {
  EMPTY_START_ROW,
  deriveDuration,
  deriveStatus,
  getTriggerTemplateLabel,
  mergeLabels,
  mergeParams,
  prepareStartDraft,
  projectPipelineRunRow,
} from "./helpers.js";

describe("mergeParams", () => {
  it("returns sorted defaults when no overrides", () => {
    const got = mergeParams(
      [
        { name: "b", value: "B" },
        { name: "a", value: "A" },
      ],
      {}
    );
    expect(got).toEqual([
      { name: "a", value: "A" },
      { name: "b", value: "B" },
    ]);
  });

  it("user value wins on key collision", () => {
    const got = mergeParams([{ name: "git-revision", value: "main" }], { "git-revision": "feat" });
    expect(got).toEqual([{ name: "git-revision", value: "feat" }]);
  });

  it("appends user keys absent from defaults, sorted", () => {
    const got = mergeParams([{ name: "a", value: "A" }], { z: "Z", b: "B" });
    expect(got.map((p) => p.name)).toEqual(["a", "b", "z"]);
  });

  it("handles undefined defaults and overrides", () => {
    expect(mergeParams(undefined, undefined)).toEqual([]);
    expect(mergeParams(undefined, { k: "v" })).toEqual([{ name: "k", value: "v" }]);
    expect(mergeParams([{ name: "k", value: "v" }], undefined)).toEqual([{ name: "k", value: "v" }]);
  });

  it("preserves empty-string user values (Tekton allows them)", () => {
    const got = mergeParams([{ name: "image-tag", value: "latest" }], { "image-tag": "" });
    expect(got).toEqual([{ name: "image-tag", value: "" }]);
  });
});

describe("mergeLabels", () => {
  it("user labels override draft labels", () => {
    const got = mergeLabels({ a: "1", b: "2" }, { b: "OVERRIDE", c: "3" });
    expect(got).toEqual({ a: "1", b: "OVERRIDE", c: "3" });
  });

  it("drops undefined draft label values", () => {
    const got = mergeLabels({ a: "1", b: undefined }, {});
    expect(got).toEqual({ a: "1" });
  });

  it("returns {} when both inputs are empty", () => {
    expect(mergeLabels(undefined, undefined)).toEqual({});
  });
});

describe("prepareStartDraft", () => {
  const baseDraft = {
    apiVersion: "tekton.dev/v1",
    kind: "PipelineRun",
    metadata: { name: "old-name", namespace: "edp", labels: { a: "1" } },
    spec: {
      pipelineRef: { name: "foo-build" },
      params: [{ name: "git-revision", value: "main" }],
    },
  } as unknown as PipelineRunDraft;

  it("replaces metadata.name with metadata.generateName and pins namespace", () => {
    const got = prepareStartDraft(baseDraft, "foo-build", "edp", undefined, undefined) as Record<string, unknown>;
    const meta = got.metadata as Record<string, unknown>;

    expect(meta.name).toBeUndefined();
    expect(meta.generateName).toBe("foo-build-run-");
    expect(meta.namespace).toBe("edp");
  });

  it("does not mutate the input draft", () => {
    prepareStartDraft(baseDraft, "foo-build", "edp", { "git-revision": "feat" }, { extra: "x" });
    expect((baseDraft.metadata as Record<string, unknown>).name).toBe("old-name");
    expect((baseDraft.metadata as Record<string, unknown>).labels).toEqual({ a: "1" });
    expect((baseDraft.spec as { params: unknown }).params).toEqual([{ name: "git-revision", value: "main" }]);
  });

  it("merges user params over Pipeline defaults (user wins)", () => {
    const got = prepareStartDraft(
      baseDraft,
      "foo-build",
      "edp",
      { "git-revision": "feat-branch" },
      undefined
    ) as Record<string, unknown>;

    const params = (got.spec as { params: Array<{ name: string; value: unknown }> }).params;
    expect(params.find((p) => p.name === "git-revision")?.value).toBe("feat-branch");
  });

  it("merges user labels over draft labels (user wins)", () => {
    const got = prepareStartDraft(baseDraft, "foo-build", "edp", undefined, {
      a: "OVERRIDE",
      extra: "x",
    }) as Record<string, unknown>;

    const labels = (got.metadata as { labels: Record<string, string> }).labels;
    expect(labels.a).toBe("OVERRIDE");
    expect(labels.extra).toBe("x");
  });

  it("pins namespace to the requested namespace", () => {
    const got = prepareStartDraft(baseDraft, "foo-build", "other-ns", undefined, undefined) as Record<string, unknown>;
    expect((got.metadata as Record<string, unknown>).namespace).toBe("other-ns");
  });
});

describe("projectPipelineRunRow", () => {
  it("returns empty row when input is null/undefined", () => {
    expect(projectPipelineRunRow(undefined)).toEqual(EMPTY_START_ROW);
    expect(projectPipelineRunRow(null)).toEqual(EMPTY_START_ROW);
  });

  it("projects labels to row fields", () => {
    const pr = {
      metadata: {
        name: "foo-build-run-x9k2p",
        namespace: "edp",
        labels: {
          "app.edp.epam.com/codebase": "my-app",
          "app.edp.epam.com/pipelinetype": "build",
          "app.edp.epam.com/changenumber": "44",
          "app.edp.epam.com/gitauthor": "alice",
        },
      },
      status: { conditions: [{ type: "Succeeded", status: "Unknown" }], startTime: "2026-01-01T00:00:00Z" },
    } as unknown as PipelineRun;

    const row = projectPipelineRunRow(pr);
    expect(row.name).toBe("foo-build-run-x9k2p");
    expect(row.project).toBe("my-app");
    expect(row.pr).toBe("44");
    expect(row.author).toBe("alice");
    expect(row.type).toBe("build");
    expect(row.status).toBe("Running");
    expect(row.started).toBe("2026-01-01T00:00:00Z");
    expect(row.duration).toBe(""); // no completionTime yet
  });

  it("derives empty cells for unpopulated labels", () => {
    const pr = {
      metadata: { name: "x", namespace: "edp", labels: {} },
      status: {},
    } as unknown as PipelineRun;

    const row = projectPipelineRunRow(pr);
    expect(row.project).toBe("");
    expect(row.pr).toBe("");
    expect(row.status).toBe("Pending");
  });
});

describe("deriveStatus", () => {
  it("Pending when no condition", () => {
    expect(deriveStatus(undefined)).toBe("Pending");
  });

  it("Succeeded on True", () => {
    expect(deriveStatus({ status: "True" })).toBe("Succeeded");
  });

  it("Failed on False default reason", () => {
    expect(deriveStatus({ status: "False", reason: "TaskRunFailed" })).toBe("Failed");
  });

  it("Cancelled on PipelineRunCancelled", () => {
    expect(deriveStatus({ status: "False", reason: "PipelineRunCancelled" })).toBe("Cancelled");
  });

  it("Timeout on PipelineRunTimeout", () => {
    expect(deriveStatus({ status: "False", reason: "PipelineRunTimeout" })).toBe("Timeout");
  });

  it("Running on Unknown / other", () => {
    expect(deriveStatus({ status: "Unknown" })).toBe("Running");
  });
});

describe("deriveDuration", () => {
  it("empty when missing start", () => {
    expect(deriveDuration(undefined, "2026-01-01T00:00:30Z")).toBe("");
  });

  it("empty when missing end", () => {
    expect(deriveDuration("2026-01-01T00:00:00Z", undefined)).toBe("");
  });

  it("formats seconds-only", () => {
    expect(deriveDuration("2026-01-01T00:00:00Z", "2026-01-01T00:00:30Z")).toBe("30s");
  });

  it("formats minutes+seconds", () => {
    expect(deriveDuration("2026-01-01T00:00:00Z", "2026-01-01T00:01:30Z")).toBe("1m30s");
  });

  it("handles invalid timestamps", () => {
    expect(deriveDuration("not-a-date", "2026-01-01T00:00:00Z")).toBe("");
  });
});

describe("getTriggerTemplateLabel", () => {
  it("returns label value when present", () => {
    const pipe = {
      metadata: {
        name: "x",
        namespace: "edp",
        labels: { "app.edp.epam.com/triggertemplate": "foo-tt" },
      },
    } as unknown as Pipeline;
    expect(getTriggerTemplateLabel(pipe)).toBe("foo-tt");
  });

  it("returns undefined when absent", () => {
    const pipe = { metadata: { name: "x", namespace: "edp", labels: {} } } as unknown as Pipeline;
    expect(getTriggerTemplateLabel(pipe)).toBeUndefined();
  });

  it("returns undefined when label is empty string", () => {
    const pipe = {
      metadata: { name: "x", namespace: "edp", labels: { "app.edp.epam.com/triggertemplate": "" } },
    } as unknown as Pipeline;
    expect(getTriggerTemplateLabel(pipe)).toBeUndefined();
  });
});
