import z from "zod";
import {
  kubeObjectBaseSchema,
  kubeObjectMetadataSchema
} from "../../../core";
import { pipelineLabels } from "./labels";

export const pipelineTypeEnum = z.enum([
  "build",
  "review",
  "deploy",
  "clean",
  "security",
  "release",
  "tests",
]);

const pipelineLabelsSchema = z.object({
  [pipelineLabels.pipelineType]: pipelineTypeEnum,
  [pipelineLabels.triggerTemplate]: z.string(),
});

const paramSchema = z
  .object({
    name: z.string(),
    value: z.any(),
  })
  .required({
    name: true,
    value: true,
  });

const includeParamsSchema = z.object({
  name: z.string(),
  params: z.array(paramSchema),
});

const matrixSchema = z.object({
  include: z.array(includeParamsSchema).optional(),
  params: z.array(paramSchema).optional(),
});

const pipelineRefSchema = z.object({
  apiVersion: z.string().optional(),
  bundle: z.string().optional(),
  name: z.string().optional(),
  params: z.array(paramSchema).optional(),
  resolver: z.string().optional(),
});

const pipelineTaskInputResourceSchema = z
  .object({
    from: z.array(z.string()).optional(),
    name: z.string(),
    resource: z.string(),
  })
  .required({
    name: true,
    resource: true,
  });

const pipelineTaskOutputResourceSchema = z
  .object({
    name: z.string(),
    resource: z.string(),
  })
  .required({
    name: true,
    resource: true,
  });

const resourcesSchema = z.object({
  inputs: z.array(pipelineTaskInputResourceSchema).optional(),
  outputs: z.array(pipelineTaskOutputResourceSchema).optional(),
});

const taskRefSchema = z.object({
  apiVersion: z.string().optional(),
  bundle: z.string().optional(),
  kind: z.string().optional(),
  name: z.string().optional(),
  params: z.array(paramSchema).optional(),
  resolver: z.string().optional(),
});

const whenExpressionSchema = z.object({
  cel: z.string().optional(),
  input: z.string().optional(),
  operator: z.string().optional(),
  values: z.array(z.string()).optional(),
});

const workspacePipelineTaskBindingSchema = z
  .object({
    name: z.string(),
    subPath: z.string().optional(),
    workspace: z.string().optional(),
  })
  .required({
    name: true,
  });

const pipelineTaskSchema = z.object({
  description: z.string().optional(),
  displayName: z.string().optional(),
  matrix: matrixSchema.optional(),
  name: z.string().optional(),
  onError: z.enum(["continue", "stopAndFail"]).optional(),
  params: z.array(paramSchema).optional(),
  pipelineRef: pipelineRefSchema.optional(),
  pipelineSpec: z.any().optional(),
  resources: resourcesSchema.optional(),
  retries: z.number().int().optional(),
  runAfter: z.array(z.string()).optional(),
  taskRef: taskRefSchema.optional(),
  taskSpec: z.any().optional(),
  timeout: z.string().optional(),
  when: z.array(whenExpressionSchema).optional(),
  workspaces: z.array(workspacePipelineTaskBindingSchema).optional(),
});

const paramSpecSchema = z
  .object({
    default: z.any().optional(),
    enum: z.array(z.string()).optional(),
    name: z.string(),
    properties: z.record(z.object({ type: z.string() })).optional(),
    type: z.enum(["string", "array", "object"]).default("string"),
  })
  .required({
    name: true,
  });

const pipelineDeclaredResourceSchema = z
  .object({
    name: z.string(),
    optional: z.boolean().optional(),
    type: z.string(),
  })
  .required({
    name: true,
    type: true,
  });

const pipelineResultSchema = z
  .object({
    name: z.string(),
    type: z.enum(["string", "array", "object"]).default("string"),
    value: z.any(),
  })
  .required({
    name: true,
    value: true,
  });

const pipelineWorkspaceDeclarationSchema = z
  .object({
    name: z.string(),
    optional: z.boolean().optional(),
  })
  .required({
    name: true,
  });

const pipelineSpecSchema = z.object({
  description: z.string().optional(),
  displayName: z.string().optional(),
  finally: z.array(pipelineTaskSchema).optional(),
  params: z.array(paramSpecSchema).optional(),
  resources: z.array(pipelineDeclaredResourceSchema).optional(),
  results: z.array(pipelineResultSchema).optional(),
  tasks: z.array(pipelineTaskSchema).optional(),
  workspaces: z.array(pipelineWorkspaceDeclarationSchema).optional(),
});

export const pipelineSchema = kubeObjectBaseSchema.extend({
  metadata: kubeObjectMetadataSchema.extend({
    labels: pipelineLabelsSchema,
  }),
  spec: pipelineSpecSchema,
});
