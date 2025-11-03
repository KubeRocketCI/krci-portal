import z from "zod";
import { codebaseImageStreamSchema, codebaseImageStreamTagSchema } from "./schema";

export type CodebaseImageStreamTag = z.infer<typeof codebaseImageStreamTagSchema>;

export type CodebaseImageStream = z.infer<typeof codebaseImageStreamSchema>;
