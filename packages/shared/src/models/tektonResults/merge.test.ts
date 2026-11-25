import { describe, expect, it } from "vitest";
import type { PipelineRun } from "../k8s/groups/Tekton/PipelineRun/types.js";
import { mergeLiveAndHistoryPipelineRuns } from "./merge.js";

function pipelineRun({
  name,
  uid = name,
  creationTimestamp,
  startTime,
}: {
  name: string;
  uid?: string;
  creationTimestamp?: string;
  startTime?: string;
}): PipelineRun {
  return {
    apiVersion: "tekton.dev/v1",
    kind: "PipelineRun",
    metadata: { name, uid, namespace: "krci", creationTimestamp },
    spec: {},
    status: startTime ? { startTime } : undefined,
  } as unknown as PipelineRun;
}

describe("mergeLiveAndHistoryPipelineRuns", () => {
  it("keeps the live run when history has a run with the same name", () => {
    const live = pipelineRun({ name: "build-1", uid: "live-uid", creationTimestamp: "2026-10-01T10:00:00Z" });
    const archived = pipelineRun({ name: "build-1", uid: "history-uid", creationTimestamp: "2026-10-01T10:00:00Z" });

    const merged = mergeLiveAndHistoryPipelineRuns([live], [archived]);

    expect(merged.map((pr) => pr.metadata.uid)).toEqual(["live-uid"]);
  });

  it("sorts live and history runs together, newest first", () => {
    const live = [
      pipelineRun({ name: "live-old", creationTimestamp: "2026-10-01T08:00:00Z" }),
      pipelineRun({ name: "live-new", creationTimestamp: "2026-10-01T12:00:00Z" }),
    ];
    const history = [
      pipelineRun({ name: "history-start-only", startTime: "2026-10-01T10:00:00Z" }),
      pipelineRun({ name: "history-no-time" }),
      pipelineRun({ name: "history-newest", creationTimestamp: "2026-10-01T13:00:00Z" }),
    ];

    const merged = mergeLiveAndHistoryPipelineRuns(live, history);

    expect(merged.map((pr) => pr.metadata.name)).toEqual([
      "history-newest",
      "live-new",
      "history-start-only",
      "live-old",
      "history-no-time",
    ]);
  });

  it("puts live runs before history runs with the same time", () => {
    const time = "2026-10-01T10:00:00Z";

    const merged = mergeLiveAndHistoryPipelineRuns(
      [
        pipelineRun({ name: "live-a", creationTimestamp: time }),
        pipelineRun({ name: "live-b", creationTimestamp: time }),
      ],
      [pipelineRun({ name: "history-a", creationTimestamp: time })]
    );

    expect(merged.map((pr) => pr.metadata.name)).toEqual(["live-a", "live-b", "history-a"]);
  });
});
