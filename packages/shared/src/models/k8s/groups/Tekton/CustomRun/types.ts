import z from "zod";
import { customRunSchema } from "./schema.js";

export type CustomRun = z.infer<typeof customRunSchema>;
