import z from "zod";
import { codebaseImageStreamSchema, codebaseImageStreamTagSchema } from "./schema.js";

export type CodebaseImageStreamTag = z.infer<typeof codebaseImageStreamTagSchema>;

export type CodebaseImageStream = z.infer<typeof codebaseImageStreamSchema>;
