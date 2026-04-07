import "zod-openapi/extend";
import { z } from "zod";

export const tektonResultSummarySchema = z
  .object({
    record: z.string(),
    type: z.string(),
    status: z.enum(["UNKNOWN", "SUCCESS", "FAILURE", "TIMEOUT", "CANCELLED"]),
    start_time: z.string().optional(),
    end_time: z.string().optional(),
    annotations: z.record(z.unknown()).optional(),
  })
  .openapi({ ref: "TektonResultSummary" });

export const tektonResultSchema = z
  .object({
    uid: z.string(),
    name: z.string(),
    create_time: z.string(),
    update_time: z.string(),
    summary: tektonResultSummarySchema.optional(),
    annotations: z.record(z.unknown()).optional(),
    etag: z.string().optional(),
  })
  .openapi({ ref: "TektonResult" });

export const tektonResultsListOutputSchema = z
  .object({
    results: z.array(tektonResultSchema),
    nextPageToken: z.string().optional(),
  })
  .openapi({ ref: "PipelineRunResultsResponse" });

const stepTerminatedSchema = z
  .object({
    containerID: z.string().optional(),
    exitCode: z.number().int(),
    finishedAt: z.string().optional(),
    message: z.string().optional(),
    reason: z.string().optional(),
    signal: z.number().int().optional(),
    startedAt: z.string().optional(),
  })
  .openapi({ ref: "StepTerminated" });

const decodedTaskRunStepStateSchema = z
  .object({
    name: z.string().optional(),
    container: z.string().optional(),
    imageID: z.string().optional(),
    running: z.object({ startedAt: z.string().optional() }).optional(),
    terminated: stepTerminatedSchema.optional(),
    waiting: z.object({ message: z.string().optional(), reason: z.string().optional() }).optional(),
    results: z.array(z.object({ name: z.string(), type: z.string().optional(), value: z.unknown() })).optional(),
  })
  .openapi({ ref: "TaskRunStep" });

const decodedTaskRunConditionSchema = z
  .object({
    type: z.string(),
    status: z.string(),
    reason: z.string().optional(),
    message: z.string().optional(),
    lastTransitionTime: z.string().optional(),
  })
  .openapi({ ref: "TaskRunCondition" });

const decodedTaskRunStatusSchema = z
  .object({
    podName: z.string(),
    conditions: z.array(decodedTaskRunConditionSchema).optional(),
    steps: z.array(decodedTaskRunStepStateSchema).optional(),
    startTime: z.string().optional(),
    completionTime: z.string().optional(),
    taskResults: z.array(z.object({ name: z.string(), type: z.string().optional(), value: z.unknown() })).optional(),
    results: z.array(z.object({ name: z.string(), type: z.string().optional(), value: z.unknown() })).optional(),
    taskSpec: z.unknown().optional(),
    annotations: z.record(z.string()).optional(),
    spanContext: z.record(z.string()).optional(),
    sidecars: z.array(z.unknown()).optional(),
  })
  .openapi({ ref: "TaskRunStatus" });

const decodedTaskRunMetadataSchema = z
  .object({
    name: z.string(),
    namespace: z.string(),
    uid: z.string(),
    labels: z.record(z.string()).optional(),
    annotations: z.record(z.string()).optional(),
    creationTimestamp: z.string().optional(),
    resourceVersion: z.string().optional(),
    generation: z.number().int().optional(),
  })
  .openapi({ ref: "TaskRunMetadata" });

const decodedTaskRunSchema = z
  .object({
    apiVersion: z.string(),
    kind: z.string(),
    metadata: decodedTaskRunMetadataSchema,
    spec: z.object({
      params: z.array(z.object({ name: z.string(), value: z.unknown() })).optional(),
      taskRef: z
        .object({
          name: z.string().optional(),
          kind: z.string().optional(),
          apiVersion: z.string().optional(),
          resolver: z.string().optional(),
        })
        .optional(),
      serviceAccountName: z.string().optional(),
      timeout: z.string().optional(),
      workspaces: z.array(z.record(z.unknown())).optional(),
    }),
    status: decodedTaskRunStatusSchema,
  })
  .openapi({ ref: "TaskRun" });

export const taskRunRecordsOutputSchema = z
  .object({
    taskRuns: z.array(decodedTaskRunSchema),
  })
  .openapi({ ref: "TaskRunRecordsResponse" });
