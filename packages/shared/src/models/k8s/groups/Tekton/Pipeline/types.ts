import z from "zod";
import { pipelineSchema, pipelineTypeEnum } from ".";

export type Pipeline = z.infer<typeof pipelineSchema>;

export type PipelineType = z.infer<typeof pipelineTypeEnum>;
