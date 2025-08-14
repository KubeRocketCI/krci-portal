import z from "zod";
import { taskSchema } from "./schema";

export type Task = z.infer<typeof taskSchema>;
