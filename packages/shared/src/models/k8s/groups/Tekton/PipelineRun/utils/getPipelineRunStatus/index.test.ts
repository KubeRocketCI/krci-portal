import { describe, expect, it } from "vitest";
import { getPipelineRunStatus } from "./index.js";

describe("getPipelineRunStatus", () => {
  it("should extract status from first condition", () => {
    const pipelineRun = {
      status: {
        conditions: [
          {
            status: "True",
            reason: "Succeeded",
            message: "Tasks completed",
            lastTransitionTime: "2023-01-01T00:00:00Z",
          },
        ],
        startTime: "2023-01-01T00:00:00Z",
        completionTime: "2023-01-01T01:00:00Z",
      },
    } as any;

    const result = getPipelineRunStatus(pipelineRun);

    expect(result.status).toBe("true");
    expect(result.reason).toBe("succeeded");
    expect(result.message).toBe("Tasks completed");
    expect(result.lastTransitionTime).toBe("2023-01-01T00:00:00Z");
    expect(result.startTime).toBe("2023-01-01T00:00:00Z");
    expect(result.completionTime).toBe("2023-01-01T01:00:00Z");
  });

  it("should return defaults for undefined input", () => {
    const result = getPipelineRunStatus(undefined);

    expect(result.status).toBe("Unknown");
    expect(result.reason).toBe("Unknown");
    expect(result.message).toBe("No message");
    expect(result.lastTransitionTime).toBe("N/A");
    expect(result.startTime).toBe("N/A");
    expect(result.completionTime).toBe("N/A");
  });

  it("should handle missing conditions array", () => {
    const pipelineRun = {
      status: {
        startTime: "2023-01-01T00:00:00Z",
      },
    } as any;

    const result = getPipelineRunStatus(pipelineRun);

    expect(result.status).toBe("Unknown");
    expect(result.reason).toBe("Unknown");
    expect(result.startTime).toBe("2023-01-01T00:00:00Z");
  });

  it("should handle empty conditions array", () => {
    const pipelineRun = {
      status: {
        conditions: [],
      },
    } as any;

    const result = getPipelineRunStatus(pipelineRun);

    expect(result.status).toBe("Unknown");
    expect(result.reason).toBe("Unknown");
  });
});
