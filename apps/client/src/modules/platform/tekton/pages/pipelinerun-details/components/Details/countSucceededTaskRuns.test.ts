import { describe, expect, it } from "vitest";
import { countSucceededTaskRuns } from "./countSucceededTaskRuns";

type Task = Parameters<typeof countSucceededTaskRuns>[0] extends ReadonlyMap<string, infer T> ? T : never;

const condition = (status: string, reason: string): Task => ({
  run: { status: { conditions: [{ type: "Succeeded", status, reason }] } },
});

describe("countSucceededTaskRuns", () => {
  it("counts only runs in the succeeded phase", () => {
    const tasks = new Map([
      ["a", condition("True", "Succeeded")],
      ["b", condition("False", "Failed")],
      ["c", condition("Unknown", "Running")],
      ["d", condition("False", "TaskRunCancelled")],
      ["e", condition("True", "Succeeded")],
      ["f", condition("True", "Approved")],
    ]);

    expect(countSucceededTaskRuns(tasks)).toBe(3);
  });

  it("ignores pipeline tasks with no run object", () => {
    const tasks = new Map<string, Task>([
      ["a", {}],
      ["b", condition("True", "Succeeded")],
    ]);

    expect(countSucceededTaskRuns(tasks)).toBe(1);
  });

  it("reads the Succeeded condition rather than the first one", () => {
    const tasks = new Map<string, Task>([
      [
        "a",
        {
          run: {
            status: {
              conditions: [
                { type: "Ready", status: "False", reason: "Failed" },
                { type: "Succeeded", status: "True", reason: "Succeeded" },
              ],
            },
          },
        },
      ],
    ]);

    expect(countSucceededTaskRuns(tasks)).toBe(1);
  });

  it("returns zero for an empty map", () => {
    expect(countSucceededTaskRuns(new Map())).toBe(0);
  });
});
