import { describe, expect, it } from "vitest";
import { buildTaskRunNameByPipelineTaskMap, isTaskRunChildReference, type PipelineRunChildReference } from "./index.js";

const PIPELINE_RUN_NAME = "review-sonar-operator-master-9grsx";

describe("isTaskRunChildReference", () => {
  it("accepts TaskRun and unspecified kinds", () => {
    expect(isTaskRunChildReference({ kind: "TaskRun" })).toBe(true);
    expect(isTaskRunChildReference({})).toBe(true);
  });

  it("rejects CustomRun children", () => {
    expect(isTaskRunChildReference({ kind: "Run" })).toBe(false);
  });
});

describe("buildTaskRunNameByPipelineTaskMap", () => {
  it("maps pipeline task names to their TaskRun names", () => {
    const map = buildTaskRunNameByPipelineTaskMap([
      { pipelineTaskName: "sonar", name: `${PIPELINE_RUN_NAME}-sonar` },
      { pipelineTaskName: "sonar-integration-test", name: `${PIPELINE_RUN_NAME}-sonar-integration-test` },
    ]);

    expect(map.get("sonar")).toBe(`${PIPELINE_RUN_NAME}-sonar`);
    expect(map.get("sonar-integration-test")).toBe(`${PIPELINE_RUN_NAME}-sonar-integration-test`);
  });

  it("maps hashed TaskRun names that cannot be derived from the pipeline task name", () => {
    const map = buildTaskRunNameByPipelineTaskMap([
      {
        pipelineTaskName: "github-report-pipeline-status",
        name: "r4b6fb41c94b7ea194670faf5a9795c34-github-report-pipeline-status",
      },
    ]);

    expect(map.get("github-report-pipeline-status")).toBe(
      "r4b6fb41c94b7ea194670faf5a9795c34-github-report-pipeline-status"
    );
  });

  it("skips incomplete child references and tolerates missing input", () => {
    expect(buildTaskRunNameByPipelineTaskMap(undefined).size).toBe(0);
    expect(buildTaskRunNameByPipelineTaskMap([]).size).toBe(0);
    expect(buildTaskRunNameByPipelineTaskMap([{ pipelineTaskName: "sonar" }, { name: "orphan" }]).size).toBe(0);
  });

  it("excludes CustomRun children", () => {
    const childReferences = [
      { pipelineTaskName: "sonar", name: `${PIPELINE_RUN_NAME}-sonar`, kind: "Run" },
    ] as PipelineRunChildReference[];

    expect(buildTaskRunNameByPipelineTaskMap(childReferences).size).toBe(0);
  });
});
