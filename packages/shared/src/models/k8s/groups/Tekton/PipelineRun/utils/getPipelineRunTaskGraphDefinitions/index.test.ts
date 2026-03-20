import { describe, expect, it } from "vitest";
import type { PipelineRun } from "../../types.js";
import { getPipelineRunTaskGraphDefinitions } from "./index.js";

describe("getPipelineRunTaskGraphDefinitions", () => {
  it("returns empty when pipelineRun is undefined", () => {
    expect(getPipelineRunTaskGraphDefinitions(undefined)).toEqual({
      allTasks: [],
      mainTasks: [],
      finallyTasks: [],
    });
  });

  it("prefers status.pipelineSpec.tasks over spec.pipelineSpec", () => {
    const pr = {
      spec: {
        pipelineSpec: {
          tasks: [{ name: "from-spec" }],
        },
      },
      status: {
        pipelineSpec: {
          tasks: [{ name: "from-status" }],
        },
      },
    } as unknown as PipelineRun;

    const r = getPipelineRunTaskGraphDefinitions(pr);
    expect(r.mainTasks).toEqual([{ name: "from-status" }]);
  });

  it("falls back to spec.pipelineSpec when status has no tasks", () => {
    const pr = {
      spec: {
        pipelineSpec: {
          tasks: [{ name: "inline-a" }, { name: "inline-b" }],
          finally: [{ name: "finally-x" }],
        },
      },
      status: {
        pipelineSpec: {},
      },
    } as unknown as PipelineRun;

    const r = getPipelineRunTaskGraphDefinitions(pr);
    expect(r.mainTasks).toHaveLength(2);
    expect(r.finallyTasks).toEqual([{ name: "finally-x" }]);
    expect(r.allTasks).toHaveLength(3);
  });

  it("synthesizes tasks from childReferences when specs have no task lists", () => {
    const pr = {
      metadata: { name: "pr-1" },
      status: {
        childReferences: [
          { kind: "TaskRun", name: "tr-1", apiVersion: "tekton.dev/v1", pipelineTaskName: "build" },
          { kind: "TaskRun", name: "tr-2", apiVersion: "tekton.dev/v1", pipelineTaskName: "test" },
        ],
      },
    } as unknown as PipelineRun;

    const r = getPipelineRunTaskGraphDefinitions(pr);
    expect(r.mainTasks.map((t) => t.name)).toEqual(["build", "test"]);
    expect(r.finallyTasks).toEqual([]);
  });
});
