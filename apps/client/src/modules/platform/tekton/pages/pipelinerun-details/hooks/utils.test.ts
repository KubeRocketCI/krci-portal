import { ApprovalTask, approvalTaskLabels, PipelineTask, Task, TaskRun, taskRunLabels } from "@my-project/shared";
import { describe, expect, it } from "vitest";
import { buildPipelineRunTasksByNameMap, buildTaskRunIndex, findTaskRunForPipelineTask } from "./utils";

const PIPELINE_RUN_NAME = "review-sonar-operator-master-9grsx";

const makeTaskRun = (name: string, pipelineTaskLabel?: string): TaskRun =>
  ({
    metadata: {
      name,
      ...(pipelineTaskLabel ? { labels: { [taskRunLabels.pipelineTask]: pipelineTaskLabel } } : {}),
    },
  }) as TaskRun;

const makePipelineTask = (name: string, taskRefName?: string): PipelineTask =>
  ({ name, ...(taskRefName ? { taskRef: { name: taskRefName } } : {}) }) as PipelineTask;

const makeTask = (name: string): Task => ({ metadata: { name } }) as Task;

const makeApprovalTask = (name: string, pipelineTaskLabel: string): ApprovalTask =>
  ({
    metadata: { name, labels: { [approvalTaskLabels.pipelineTask]: pipelineTaskLabel } },
  }) as unknown as ApprovalTask;

describe("findTaskRunForPipelineTask", () => {
  it("matches by the pipelineTask label", () => {
    const index = buildTaskRunIndex([
      makeTaskRun(`${PIPELINE_RUN_NAME}-sonar-integration-test`, "sonar-integration-test"),
      makeTaskRun(`${PIPELINE_RUN_NAME}-sonar`, "sonar"),
    ]);

    expect(findTaskRunForPipelineTask(index, "sonar")?.metadata?.name).toBe(`${PIPELINE_RUN_NAME}-sonar`);
  });

  it("does not bind a task to a sibling whose name it prefixes when its TaskRun is absent", () => {
    const index = buildTaskRunIndex(
      [makeTaskRun(`${PIPELINE_RUN_NAME}-sonar-integration-test`, "sonar-integration-test")],
      [{ pipelineTaskName: "sonar-integration-test", name: `${PIPELINE_RUN_NAME}-sonar-integration-test` }]
    );

    expect(findTaskRunForPipelineTask(index, "sonar")).toBeUndefined();
  });

  it("falls back to the child reference name for unlabeled TaskRuns", () => {
    const index = buildTaskRunIndex(
      [makeTaskRun(`${PIPELINE_RUN_NAME}-sonar-integration-test`), makeTaskRun("r4b6fb41c9-sonar")],
      [
        { pipelineTaskName: "sonar", name: "r4b6fb41c9-sonar" },
        { pipelineTaskName: "sonar-integration-test", name: `${PIPELINE_RUN_NAME}-sonar-integration-test` },
      ]
    );

    expect(findTaskRunForPipelineTask(index, "sonar")?.metadata?.name).toBe("r4b6fb41c9-sonar");
  });

  it("keeps the first TaskRun when several share a pipelineTask label", () => {
    const index = buildTaskRunIndex([makeTaskRun("first", "sonar"), makeTaskRun("second", "sonar")]);

    expect(findTaskRunForPipelineTask(index, "sonar")?.metadata?.name).toBe("first");
  });

  it("returns undefined for a pipeline task without a name", () => {
    expect(findTaskRunForPipelineTask(buildTaskRunIndex([makeTaskRun("x", "y")]), undefined)).toBeUndefined();
  });
});

describe("buildPipelineRunTasksByNameMap", () => {
  it("keeps prefix-colliding tasks bound to distinct TaskRuns", () => {
    const map = buildPipelineRunTasksByNameMap({
      allPipelineTasks: [makePipelineTask("sonar"), makePipelineTask("sonar-integration-test")],
      taskRuns: [makeTaskRun(`${PIPELINE_RUN_NAME}-sonar-integration-test`, "sonar-integration-test")],
      approvalTasks: [],
      childReferences: [
        { pipelineTaskName: "sonar-integration-test", name: `${PIPELINE_RUN_NAME}-sonar-integration-test` },
      ],
    });

    expect(map.get("sonar")?.taskRun).toBeUndefined();
    expect(map.get("sonar-integration-test")?.taskRun?.metadata?.name).toBe(
      `${PIPELINE_RUN_NAME}-sonar-integration-test`
    );
  });

  it("resolves the Task by taskRef name and the ApprovalTask by label", () => {
    const map = buildPipelineRunTasksByNameMap({
      allPipelineTasks: [makePipelineTask("sonar", "sonar-scanner-task")],
      tasks: [makeTask("unrelated-task"), makeTask("sonar-scanner-task")],
      taskRuns: [],
      approvalTasks: [makeApprovalTask("approve-sonar", "sonar")],
      childReferences: [],
    });

    const entry = map.get("sonar");
    expect(entry?.task?.metadata?.name).toBe("sonar-scanner-task");
    expect(entry?.approvalTask?.metadata?.name).toBe("approve-sonar");
  });

  it("leaves the Task unresolved when the pipeline task has no taskRef", () => {
    const map = buildPipelineRunTasksByNameMap({
      allPipelineTasks: [makePipelineTask("sonar")],
      tasks: [makeTask("sonar")],
      taskRuns: [],
      approvalTasks: [],
    });

    expect(map.get("sonar")?.task).toBeUndefined();
  });

  it("skips pipeline tasks without a name", () => {
    const map = buildPipelineRunTasksByNameMap({
      allPipelineTasks: [{} as PipelineTask, makePipelineTask("sonar")],
      taskRuns: [],
      approvalTasks: [],
    });

    expect(map.size).toBe(1);
    expect(map.has("sonar")).toBe(true);
  });
});
