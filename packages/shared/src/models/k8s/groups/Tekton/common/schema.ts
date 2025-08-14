import z from "zod";

// Shared param value schema used across Pipeline, PipelineRun, TaskRun
export const paramValueSchema = z
  .object({
    name: z.string(),
    value: z.any(),
  })
  .required({ name: true, value: true });

// Shared when expression schema
export const whenExpressionSchema = z.object({
  cel: z.string().optional(),
  input: z.string().optional(),
  operator: z.string().optional(),
  values: z.array(z.string()).optional(),
});

// Shared PipelineRef schema
export const pipelineRefSchema = z.object({
  apiVersion: z.string().optional(),
  bundle: z.string().optional(),
  name: z.string().optional(),
  params: z.array(paramValueSchema).optional(),
  resolver: z.string().optional(),
});

// Shared TaskRef schema
export const taskRefSchema = z.object({
  apiVersion: z.string().optional(),
  bundle: z.string().optional(),
  kind: z.string().optional(),
  name: z.string().optional(),
  params: z.array(paramValueSchema).optional(),
  resolver: z.string().optional(),
});
