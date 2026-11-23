import z from "zod";
import { workerPoolSchema } from "./schema.js";

export type WorkerPool = z.infer<typeof workerPoolSchema>;
