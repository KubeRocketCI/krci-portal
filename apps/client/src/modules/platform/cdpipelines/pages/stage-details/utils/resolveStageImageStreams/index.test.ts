import { describe, it, expect } from "vitest";
import { CodebaseImageStream, Stage } from "@my-project/shared";
import { findPreviousStage, getVerifiedImageStream, normalizeStreamNameSet, resolveInputImageStream } from "./index";

const makeStage = (cdPipeline: string, name: string, order: number): Stage =>
  ({ spec: { cdPipeline, name, order } }) as unknown as Stage;

const makeStream = (name: string, codebase: string, tags: string[] = []): CodebaseImageStream =>
  ({
    metadata: { name },
    spec: { codebase, tags: tags.map((t) => ({ name: t, created: "2026-01-01T00:00:00Z" })) },
  }) as unknown as CodebaseImageStream;

describe("normalizeStreamNameSet", () => {
  it("replaces dots with dashes and dedupes", () => {
    const set = normalizeStreamNameSet(["app.one-main", "app-two-main", "app.one-main"]);
    expect(set.has("app-one-main")).toBe(true);
    expect(set.has("app-two-main")).toBe(true);
    expect(set.size).toBe(2);
  });

  it("treats undefined as empty", () => {
    expect(normalizeStreamNameSet(undefined).size).toBe(0);
  });
});

describe("findPreviousStage", () => {
  // Every pipeline's stages share one namespace. The regression: an order-0 stage from a
  // DIFFERENT pipeline must never be picked as the previous stage just because it matches `order`.
  const stages = [
    makeStage("other", "sit", 0), // foreign pipeline, sorts first, same order — the trap
    makeStage("demo", "dev", 0),
    makeStage("demo", "qa", 1),
    makeStage("demo", "prod", 2),
  ];

  it("returns the previous stage within the same pipeline, ignoring foreign same-order stages", () => {
    const prev = findPreviousStage(stages, 1, "demo");
    expect(prev?.spec.cdPipeline).toBe("demo");
    expect(prev?.spec.name).toBe("dev");
  });

  it("returns undefined when the pipeline has no stage at order - 1", () => {
    expect(findPreviousStage(stages, 1, "nonexistent")).toBeUndefined();
  });
});

describe("getVerifiedImageStream", () => {
  it("matches <pipeline>-<stage>-<codebase>-verified", () => {
    const streams = [
      makeStream("demo-qa-test-go-app-verified", "test-go-app", ["main-1"]),
      makeStream("demo-dev-test-go-app-verified", "test-go-app", ["main-1"]),
    ];
    expect(getVerifiedImageStream(streams, "demo", "qa", "test-go-app")?.metadata.name).toBe(
      "demo-qa-test-go-app-verified"
    );
  });

  it("returns undefined when the stage has no own verified stream", () => {
    expect(getVerifiedImageStream([], "demo", "qa", "test-go-app")).toBeUndefined();
  });
});

describe("resolveInputImageStream", () => {
  const build = makeStream("test-go-app-main", "test-go-app", ["main-1"]);
  const devVerified = makeStream("demo-dev-test-go-app-verified", "test-go-app", ["main-1"]);
  const inputDockerStreamsSet = normalizeStreamNameSet(["test-go-app-main"]);

  const stages = [
    makeStage("other", "sit", 0), // foreign order-0 stage with a DIFFERENT name, listed first
    makeStage("demo", "dev", 0),
    makeStage("demo", "qa", 1),
  ];

  it("order 0 (promote): resolves the pipeline's build stream", () => {
    const result = resolveInputImageStream({
      imageStreams: [build, devVerified],
      stageOrder: 0,
      inputDockerStreamsSet,
      stages,
      cdPipelineName: "demo",
      isPromote: true,
    });
    expect(result?.metadata.name).toBe("test-go-app-main");
  });

  // Core regression: at order 1 the dropdown must read the PREVIOUS stage's verified stream of
  // the SAME pipeline (demo-dev-...), not be blanked by the foreign "sit" stage sorted first.
  it("order 1 (promote): resolves the same pipeline's previous-stage verified stream despite a foreign order-0 stage", () => {
    const result = resolveInputImageStream({
      imageStreams: [build, devVerified],
      stageOrder: 1,
      inputDockerStreamsSet,
      stages,
      cdPipelineName: "demo",
      isPromote: true,
    });
    expect(result?.metadata.name).toBe("demo-dev-test-go-app-verified");
  });

  it("order 1 (promote): returns undefined when the same pipeline has no previous stage", () => {
    const result = resolveInputImageStream({
      imageStreams: [build, devVerified],
      stageOrder: 1,
      inputDockerStreamsSet,
      stages: [makeStage("other", "sit", 0)],
      cdPipelineName: "demo",
      isPromote: true,
    });
    expect(result).toBeUndefined();
  });

  it("non-promote app: resolves the build stream regardless of order", () => {
    const result = resolveInputImageStream({
      imageStreams: [build, devVerified],
      stageOrder: 1,
      inputDockerStreamsSet,
      stages,
      cdPipelineName: "demo",
      isPromote: false,
    });
    expect(result?.metadata.name).toBe("test-go-app-main");
  });
});
