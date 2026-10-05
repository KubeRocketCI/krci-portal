import {
  ApprovalTask,
  approvalTaskLabels,
  CustomRun,
  customRunLabels,
  PipelineTask,
  TaskRun,
  taskRunLabels,
} from "@my-project/shared";
import { describe, expect, it } from "vitest";
import {
  buildPipelineRunTasksByNameMap,
  buildTaskRunIndex,
  canHaveSteps,
  findTaskRunForPipelineTask,
  getNamespacedTaskRefName,
  getTaskName,
  isAwaitingTaskSpec,
} from "./utils";

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

const NAMESPACE = "krci";

const buildSpec = { description: "Builds the image", steps: [{ name: "compile" }, { name: "push" }] };
const inlineSpec = { description: "Inline", steps: [{ name: "echo" }] };

const withSnapshot = (taskRun: TaskRun, taskSpec: unknown, completionTime?: string): TaskRun =>
  ({ ...taskRun, status: { podName: "pod", taskSpec, completionTime } }) as TaskRun;

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

  it("resolves the ApprovalTask by label", () => {
    const map = buildPipelineRunTasksByNameMap({
      allPipelineTasks: [makePipelineTask("sonar", "sonar-scanner-task")],
      taskRuns: [],
      approvalTasks: [makeApprovalTask("approve-sonar", "sonar")],
      childReferences: [],
    });

    expect(map.get("sonar")?.approvalTask?.metadata?.name).toBe("approve-sonar");
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

describe("buildPipelineRunTasksByNameMap with CustomRuns", () => {
  const makeCustomRun = (name: string, pipelineTaskLabel: string): CustomRun =>
    ({ metadata: { name, labels: { [customRunLabels.pipelineTask]: pipelineTaskLabel } } }) as unknown as CustomRun;

  it("resolves a task's run to its TaskRun, else to its CustomRun by the pipelineTask label", () => {
    const result = buildPipelineRunTasksByNameMap({
      allPipelineTasks: [makePipelineTask("approve"), makePipelineTask("build")],
      taskRuns: [makeTaskRun(`${PIPELINE_RUN_NAME}-build`, "build")],
      approvalTasks: [],
      customRuns: [makeCustomRun(`${PIPELINE_RUN_NAME}-approve`, "approve")],
    });

    expect(result.get("approve")?.taskRun).toBeUndefined();
    expect(result.get("approve")?.run?.metadata?.name).toBe(`${PIPELINE_RUN_NAME}-approve`);
    expect(result.get("build")?.run?.metadata?.name).toBe(`${PIPELINE_RUN_NAME}-build`);
  });
});

describe("buildPipelineRunTasksByNameMap task spec", () => {
  it("takes the spec from the TaskRun snapshot before the inline spec", () => {
    const map = buildPipelineRunTasksByNameMap({
      allPipelineTasks: [{ name: "build", taskSpec: inlineSpec }],
      taskRuns: [withSnapshot(makeTaskRun(`${PIPELINE_RUN_NAME}-build`, "build"), buildSpec)],
      approvalTasks: [],
      liveNamespace: NAMESPACE,
    });

    expect(map.get("build")?.taskSpec).toBe(buildSpec);
    expect(map.get("build")?.pendingTaskRef).toBeUndefined();
  });

  it("takes the inline spec of a task that has not started", () => {
    const map = buildPipelineRunTasksByNameMap({
      allPipelineTasks: [{ name: "echo", taskSpec: inlineSpec }],
      taskRuns: [],
      approvalTasks: [],
      liveNamespace: NAMESPACE,
    });

    expect(map.get("echo")?.taskSpec).toBe(inlineSpec);
    expect(map.get("echo")?.pendingTaskRef).toBeUndefined();
  });

  it("points a live task without a run or spec at its namespaced Task", () => {
    const map = buildPipelineRunTasksByNameMap({
      allPipelineTasks: [makePipelineTask("build", "build-image")],
      taskRuns: [],
      approvalTasks: [],
      liveNamespace: NAMESPACE,
    });

    expect(map.get("build")?.taskSpec).toBeUndefined();
    expect(map.get("build")?.pendingTaskRef).toEqual({ namespace: NAMESPACE, name: "build-image" });
  });

  it("never points a history task at a Task", () => {
    const map = buildPipelineRunTasksByNameMap({
      allPipelineTasks: [makePipelineTask("build", "build-image")],
      taskRuns: [],
      approvalTasks: [],
    });

    expect(map.get("build")?.pendingTaskRef).toBeUndefined();
  });

  it("does not point a task with a TaskRun at its Task while the snapshot is missing", () => {
    const map = buildPipelineRunTasksByNameMap({
      allPipelineTasks: [makePipelineTask("build", "build-image")],
      taskRuns: [makeTaskRun(`${PIPELINE_RUN_NAME}-build`, "build")],
      approvalTasks: [],
      liveNamespace: NAMESPACE,
    });

    expect(map.get("build")?.pendingTaskRef).toBeUndefined();
  });

  it("does not point a custom task with a CustomRun at a Task", () => {
    const customRun = {
      metadata: { name: `${PIPELINE_RUN_NAME}-approve`, labels: { [customRunLabels.pipelineTask]: "approve" } },
    } as unknown as CustomRun;

    const map = buildPipelineRunTasksByNameMap({
      allPipelineTasks: [{ name: "approve", taskRef: { kind: "Task", name: "approve" } }],
      taskRuns: [],
      approvalTasks: [],
      customRuns: [customRun],
      liveNamespace: NAMESPACE,
    });

    expect(map.get("approve")?.pendingTaskRef).toBeUndefined();
  });
});

describe("getNamespacedTaskRefName", () => {
  it.each([
    ["a name only", { name: "build" }, "build"],
    ["kind Task", { kind: "Task", name: "build" }, "build"],
    ["kind ClusterTask", { kind: "ClusterTask", name: "build" }, undefined],
    ["a resolver", { resolver: "cluster", name: "build" }, undefined],
    ["a bundle", { bundle: "registry/tasks:1", name: "build" }, undefined],
    ["a custom task", { apiVersion: "edp.epam.com/v1alpha1", kind: "ApprovalTask", name: "approve" }, undefined],
    ["no name", { kind: "Task" }, undefined],
    ["no ref", undefined, undefined],
  ])("for %s returns %s", (_, taskRef, expected) => {
    expect(getNamespacedTaskRefName(taskRef)).toBe(expected);
  });
});

describe("isAwaitingTaskSpec", () => {
  const taskRun = makeTaskRun("run-build", "build");

  it("is true for an unfinished TaskRun without a snapshot", () => {
    expect(isAwaitingTaskSpec({ taskRun, taskSpec: undefined })).toBe(true);
  });

  it("is false once the snapshot exists", () => {
    expect(isAwaitingTaskSpec({ taskRun, taskSpec: buildSpec })).toBe(false);
  });

  it("is false for a finished TaskRun without a snapshot", () => {
    expect(isAwaitingTaskSpec({ taskRun: withSnapshot(taskRun, undefined, "2026-10-05T10:00:00Z") })).toBe(false);
  });

  it("is false without a TaskRun", () => {
    expect(isAwaitingTaskSpec({ taskSpec: undefined })).toBe(false);
  });
});

describe("canHaveSteps", () => {
  it("is true for step states on the TaskRun", () => {
    const taskRun = { status: { podName: "pod", steps: [{ name: "compile" }] } } as TaskRun;
    expect(canHaveSteps({ taskRun })).toBe(true);
  });

  it("is true for steps in the spec", () => {
    expect(canHaveSteps({ taskSpec: inlineSpec })).toBe(true);
  });

  it("is true for a pending namespaced Task", () => {
    expect(canHaveSteps({ pendingTaskRef: { namespace: NAMESPACE, name: "build-image" } })).toBe(true);
  });

  it("is true while a started TaskRun waits for its snapshot", () => {
    expect(canHaveSteps({ taskRun: makeTaskRun("run-build", "build") })).toBe(true);
  });

  it("is false for a spec without steps", () => {
    expect(canHaveSteps({ taskSpec: { steps: [] } })).toBe(false);
  });

  it("is false for a history task that never ran", () => {
    expect(canHaveSteps({ taskRun: undefined, taskSpec: undefined, pendingTaskRef: undefined })).toBe(false);
  });
});

describe("getTaskName", () => {
  it("returns the Task ref name", () => {
    expect(getTaskName({ name: "build", taskRef: { kind: "Task", name: "python" } })).toBe("python");
  });

  it("falls back to the pipeline task name for an inline or resolver task", () => {
    expect(getTaskName({ name: "inline-echo", taskSpec: inlineSpec })).toBe("inline-echo");
    expect(getTaskName({ name: "lint", taskRef: { resolver: "git" } })).toBe("lint");
  });

  it("returns an empty string without a pipeline task", () => {
    expect(getTaskName(undefined)).toBe("");
  });
});
